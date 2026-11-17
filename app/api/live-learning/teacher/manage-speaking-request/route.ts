
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  RoomServiceClient,
  TrackSource,
} from "livekit-server-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isValidUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { error: "JSON content is required." },
        { status: 415 }
      );
    }

    const body = await request.json();
    const requestId = body?.requestId;
    const action = body?.action;

    if (!isValidUuid(requestId) || !["approve", "revoke", "deny"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid speaking request or action." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must sign in first." },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // Confirm that this account belongs to an approved MICAN live teacher.
    const { data: teacher, error: teacherError } = await admin
      .from("platform_live_teachers")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      teacherError ||
      !teacher ||
      teacher.status !== "approved"
    ) {
      return NextResponse.json(
        { error: "Only approved MICAN teachers can manage speaking requests." },
        { status: 403 }
      );
    }

    // Load the speaking request.
    const { data: speakingRequest, error: requestError } = await admin
      .from("live_tutorial_speaking_requests")
      .select(
        "id, tutorial_id, student_id, school_id, status"
      )
      .eq("id", requestId)
      .maybeSingle();

    if (requestError || !speakingRequest) {
      return NextResponse.json(
        { error: "Speaking request not found." },
        { status: 404 }
      );
    }

    // Confirm that this teacher is assigned to this tutorial.
    const { data: assignment, error: assignmentError } = await admin
      .from("live_tutorial_teacher_assignments")
      .select("id")
      .eq("tutorial_id", speakingRequest.tutorial_id)
      .eq("teacher_id", teacher.id)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "You are not assigned to this tutorial." },
        { status: 403 }
      );
    }

    // Confirm that the tutorial is published and currently active.
    const { data: tutorial, error: tutorialError } = await admin
      .from("live_tutorials")
      .select("id, status, scheduled_start, scheduled_end")
      .eq("id", speakingRequest.tutorial_id)
      .maybeSingle();

    if (
      tutorialError ||
      !tutorial ||
      tutorial.status !== "published"
    ) {
      return NextResponse.json(
        { error: "This tutorial is not available." },
        { status: 400 }
      );
    }

    const now = Date.now();
    const start = new Date(tutorial.scheduled_start).getTime();
    const end = new Date(tutorial.scheduled_end).getTime();

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      now < start - 15 * 60 * 1000 ||
      now > end
    ) {
      return NextResponse.json(
        { error: "Speaking permissions can only be managed during the classroom session." },
        { status: 400 }
      );
    }

    // Confirm that the student is still active in the correct school.
    const { data: student, error: studentError } = await admin
      .from("students")
      .select("id, school_id, auth_user_id, status")
      .eq("id", speakingRequest.student_id)
      .eq("school_id", speakingRequest.school_id)
      .maybeSingle();

    if (
      studentError ||
      !student ||
      student.status !== "active" ||
      !student.auth_user_id
    ) {
      return NextResponse.json(
        { error: "This student is not eligible to speak." },
        { status: 403 }
      );
    }

    // Confirm that the student's school is participating.
    const { data: enrolment, error: enrolmentError } = await admin
      .from("live_tutorial_school_enrolments")
      .select("id, status")
      .eq("tutorial_id", speakingRequest.tutorial_id)
      .eq("school_id", speakingRequest.school_id)
      .maybeSingle();

    if (
      enrolmentError ||
      !enrolment ||
      enrolment.status !== "participating"
    ) {
      return NextResponse.json(
        { error: "The student's school is not participating." },
        { status: 403 }
      );
    }

    if (action === "approve" && speakingRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending requests can be approved." },
        { status: 409 }
      );
    }

    if (action === "deny" && speakingRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending requests can be denied." },
        { status: 409 }
      );
    }

    if (action === "revoke" && speakingRequest.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved speaking permissions can be revoked." },
        { status: 409 }
      );
    }

    const liveKitUrl = process.env.LIVEKIT_URL;
    const liveKitApiKey = process.env.LIVEKIT_API_KEY;
    const liveKitApiSecret = process.env.LIVEKIT_API_SECRET;

    if (!liveKitUrl || !liveKitApiKey || !liveKitApiSecret) {
      return NextResponse.json(
        { error: "Live classroom service is not configured." },
        { status: 500 }
      );
    }

    const roomName = `mican-live-${tutorial.id}`;

    // The student must currently be connected to this classroom.
    const roomService = new RoomServiceClient(
      liveKitUrl,
      liveKitApiKey,
      liveKitApiSecret
    );

    const participants = await roomService.listParticipants(roomName);
    const connectedStudent = participants.find(
      (participant) => participant.identity === student.auth_user_id
    );

    if (!connectedStudent) {
      return NextResponse.json(
        { error: "The student is not currently inside this classroom." },
        { status: 409 }
      );
    }

    // Students can publish microphone audio only.
    // Camera and screen sharing are never granted.
    if (action === "approve" || action === "revoke") {
      await roomService.updateParticipant(roomName, student.auth_user_id, {
        permission:
          action === "approve"
            ? {
                canPublish: true,
                canPublishSources: [TrackSource.MICROPHONE],
                canSubscribe: true,
                canPublishData: false,
              }
            : {
                canPublish: false,
                canPublishSources: [],
                canSubscribe: true,
                canPublishData: false,
              },
      });
    }

    const newStatus =
      action === "approve"
        ? "approved"
        : action === "revoke"
          ? "revoked"
          : "denied";

    const { error: updateError } = await admin
      .from("live_tutorial_speaking_requests")
      .update({
        status: newStatus,
        handled_by: user.id,
        handled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", speakingRequest.id);

    if (updateError) {
      // If saving the approval failed, remove the microphone permission
      // so the student does not keep permission that the database did not record.
      if (action === "approve") {
        try {
          await roomService.updateParticipant(
            roomName,
            student.auth_user_id,
            {
              permission: {
                canPublish: false,
                canPublishSources: [],
                canSubscribe: true,
                canPublishData: false,
              },
            }
          );
        } catch {
          // The original database error is returned below.
        }
      }

      return NextResponse.json(
        { error: "Could not save the speaking request decision." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message:
        action === "approve"
          ? "Student microphone permission approved."
          : action === "revoke"
            ? "Student microphone permission revoked."
            : "Speaking request denied.",
    });
  } catch (error) {
    console.error("Manage speaking request error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while managing the request." },
      { status: 500 }
    );
  }
}
