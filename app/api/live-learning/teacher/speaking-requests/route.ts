
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

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

export async function GET(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const tutorialId = request.nextUrl.searchParams.get("tutorialId");

    if (!isValidUuid(tutorialId)) {
      return NextResponse.json(
        { error: "A valid tutorial ID is required." },
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

    // Confirm that the signed-in account is an approved MICAN teacher.
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
        { error: "Only approved MICAN teachers can view speaking requests." },
        { status: 403 }
      );
    }

    // Confirm that this teacher is assigned to the requested tutorial.
    const { data: assignment, error: assignmentError } = await admin
      .from("live_tutorial_teacher_assignments")
      .select("id")
      .eq("tutorial_id", tutorialId)
      .eq("teacher_id", teacher.id)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "You are not assigned to this tutorial." },
        { status: 403 }
      );
    }

    // Only published tutorials can have an active classroom.
    const { data: tutorial, error: tutorialError } = await admin
      .from("live_tutorials")
      .select("id, title, status, scheduled_start, scheduled_end")
      .eq("id", tutorialId)
      .maybeSingle();

    if (
      tutorialError ||
      !tutorial ||
      tutorial.status !== "published"
    ) {
      return NextResponse.json(
        { error: "This tutorial is not available." },
        { status: 404 }
      );
    }

    // Retrieve speaking requests for this tutorial.
    const { data: requests, error: requestsError } = await admin
      .from("live_tutorial_speaking_requests")
      .select(
        "id, student_id, school_id, status, requested_at, handled_at"
      )
      .eq("tutorial_id", tutorialId)
      .order("requested_at", { ascending: true })
      .limit(200);

    if (requestsError) {
      console.error("Speaking requests query error:", requestsError);

      return NextResponse.json(
        { error: "Could not load speaking requests." },
        { status: 500 }
      );
    }

    const studentIds = [
      ...new Set((requests || []).map((item) => item.student_id)),
    ];

    let students: Array<{
      id: string;
      full_name: string;
      admission_number: string;
      school_id: string;
      status: string;
    }> = [];

    if (studentIds.length > 0) {
      const { data: studentRows, error: studentsError } = await admin
        .from("students")
        .select(
          "id, full_name, admission_number, school_id, status"
        )
        .in("id", studentIds);

      if (studentsError) {
        console.error("Speaking request students query error:", studentsError);

        return NextResponse.json(
          { error: "Could not load student details." },
          { status: 500 }
        );
      }

      students = studentRows || [];
    }

    const studentMap = new Map(
      students.map((student) => [student.id, student])
    );

    const safeRequests = (requests || []).map((item) => {
      const student = studentMap.get(item.student_id);

      return {
        id: item.id,
        studentId: item.student_id,
        schoolId: item.school_id,
        status: item.status,
        requestedAt: item.requested_at,
        handledAt: item.handled_at,
        studentName:
          student && student.school_id === item.school_id
            ? student.full_name
            : "Student record unavailable",
        admissionNumber:
          student && student.school_id === item.school_id
            ? student.admission_number
            : "",
        studentActive:
          Boolean(student) &&
          student?.school_id === item.school_id &&
          student?.status === "active",
      };
    });

    return NextResponse.json(
      {
        success: true,
        tutorial: {
          id: tutorial.id,
          title: tutorial.title,
          scheduledStart: tutorial.scheduled_start,
          scheduledEnd: tutorial.scheduled_end,
        },
        requests: safeRequests,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Teacher speaking requests error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
