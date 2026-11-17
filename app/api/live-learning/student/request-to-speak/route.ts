
import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return jsonError("Request origin could not be verified.", 403);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return jsonError("Content-Type must be application/json.", 415);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("A valid JSON request body is required.", 400);
  }

  const tutorialId =
    body && typeof body === "object" && "tutorialId" in body
      ? (body as { tutorialId?: unknown }).tutorialId
      : null;

  if (typeof tutorialId !== "string" || !UUID.test(tutorialId)) {
    return jsonError("A valid tutorial ID is required.", 400);
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonError("Please sign in to your student account.", 401);
  }

  const livekitUrl = process.env.LIVEKIT_URL;
  const livekitApiKey = process.env.LIVEKIT_API_KEY;
  const livekitApiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
    return jsonError(
      "The live classroom service is not configured.",
      503
    );
  }

  try {
    const admin = createAdminClient();

    // Verify the signed-in account is an active student.
    const { data: student, error: studentError } = await admin
      .from("students")
      .select("id, school_id, full_name, status, must_change_password")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (studentError) {
      console.error("Student verification failed:", studentError.message);
      return jsonError("Your student account could not be verified.", 503);
    }

    if (!student || student.status !== "active") {
      return jsonError("An active student account is required.", 403);
    }

    if (student.must_change_password) {
      return jsonError(
        "Please change your temporary password before requesting to speak.",
        403
      );
    }

    // Verify that the student's school is approved.
    const { data: school, error: schoolError } = await admin
      .from("schools")
      .select("id, status")
      .eq("id", student.school_id)
      .maybeSingle();

    if (schoolError) {
      console.error("School verification failed:", schoolError.message);
      return jsonError("Your school could not be verified.", 503);
    }

    if (!school || school.status !== "approved") {
      return jsonError("Your school is not currently approved.", 403);
    }

    // Verify that the school is participating in this tutorial.
    const { data: enrolment, error: enrolmentError } = await admin
      .from("live_tutorial_school_enrolments")
      .select("id, status")
      .eq("tutorial_id", tutorialId)
      .eq("school_id", student.school_id)
      .maybeSingle();

    if (enrolmentError) {
      console.error(
        "School participation check failed:",
        enrolmentError.message
      );
      return jsonError(
        "Your school's tutorial participation could not be verified.",
        503
      );
    }

    if (!enrolment || enrolment.status !== "participating") {
      return jsonError(
        "Your school has not joined this tutorial.",
        403
      );
    }

    // Verify that the tutorial is published and currently available.
    const { data: tutorial, error: tutorialError } = await admin
      .from("live_tutorials")
      .select("id, scheduled_start, scheduled_end, status")
      .eq("id", tutorialId)
      .maybeSingle();

    if (tutorialError) {
      console.error("Tutorial lookup failed:", tutorialError.message);
      return jsonError("The tutorial could not be loaded.", 503);
    }

    if (!tutorial || tutorial.status !== "published") {
      return jsonError("This tutorial is not available.", 404);
    }

    const now = Date.now();
    const start = new Date(tutorial.scheduled_start).getTime();
    const end = new Date(tutorial.scheduled_end).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return jsonError("The tutorial schedule is invalid.", 409);
    }

    if (now < start - 15 * 60 * 1000) {
      return jsonError(
        "You can request to speak when the classroom opens.",
        403
      );
    }

    if (now > end) {
      return jsonError("This tutorial has already ended.", 403);
    }

    // Confirm that this student is actually connected to this LiveKit room.
    const roomName = `mican-live-${tutorial.id}`;
    const roomService = new RoomServiceClient(
      livekitUrl,
      livekitApiKey,
      livekitApiSecret
    );

    const participants = await roomService.listParticipants(roomName);
    const connectedStudent = participants.some(
      (participant) => participant.identity === user.id
    );

    if (!connectedStudent) {
      return jsonError(
        "Join the live classroom before requesting to speak.",
        403
      );
    }

    // Check whether this student already has a request.
    const { data: existing, error: existingError } = await admin
      .from("live_tutorial_speaking_requests")
      .select("id, status")
      .eq("tutorial_id", tutorialId)
      .eq("student_id", student.id)
      .maybeSingle();

    if (existingError) {
      console.error(
        "Speaking request lookup failed:",
        existingError.message
      );
      return jsonError("Your speaking request could not be checked.", 503);
    }

    if (existing?.status === "pending") {
      return NextResponse.json(
        {
          message: "Your request is already waiting for the teacher.",
          status: "pending",
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (existing?.status === "approved") {
      return NextResponse.json(
        {
          message: "Your teacher has already approved your request.",
          status: "approved",
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (existing) {
      // Allow a new request after a previous denial or revocation.
      const { error: updateError } = await admin
        .from("live_tutorial_speaking_requests")
        .update({
          status: "pending",
          requested_by: user.id,
          requested_at: new Date().toISOString(),
          handled_by: null,
          handled_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error(
          "Speaking request update failed:",
          updateError.message
        );
        return jsonError("Your speaking request could not be saved.", 503);
      }
    } else {
      const { error: insertError } = await admin
        .from("live_tutorial_speaking_requests")
        .insert({
          tutorial_id: tutorialId,
          student_id: student.id,
          school_id: student.school_id,
          requested_by: user.id,
          status: "pending",
        });

      if (insertError) {
        console.error(
          "Speaking request creation failed:",
          insertError.message
        );
        return jsonError("Your speaking request could not be saved.", 503);
      }
    }

    return NextResponse.json(
      {
        message: "Your request has been sent to the teacher.",
        status: "pending",
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Student speaking request failed:", error);

    return jsonError(
      "Your request could not be completed. Please try again.",
      500
    );
  }
}
