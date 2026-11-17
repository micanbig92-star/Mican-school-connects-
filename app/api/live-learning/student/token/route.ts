
import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
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

    // Confirm that this account belongs to an active student.
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
        "Please change your temporary password before joining.",
        403
      );
    }

    // Confirm that the student's school is approved.
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

    // The school must have actively accepted this tutorial.
    const { data: enrolment, error: enrolmentError } = await admin
      .from("live_tutorial_school_enrolments")
      .select("id, status")
      .eq("school_id", student.school_id)
      .eq("tutorial_id", tutorialId)
      .maybeSingle();

    if (enrolmentError) {
      console.error(
        "Tutorial enrolment verification failed:",
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

    // Only published tutorials can be joined.
    const { data: tutorial, error: tutorialError } = await admin
      .from("live_tutorials")
      .select(
        "id, title, subject, scheduled_start, scheduled_end, status"
      )
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

    // Students may enter 15 minutes before the scheduled start.
    const earlyJoinWindow = 15 * 60 * 1000;

    if (now < start - earlyJoinWindow) {
      return jsonError(
        "The classroom will open 15 minutes before the scheduled start.",
        403
      );
    }

    if (now > end) {
      return jsonError("This tutorial has already ended.", 403);
    }

    const roomName = `mican-live-${tutorial.id}`;

    const accessToken = new AccessToken(
      livekitApiKey,
      livekitApiSecret,
      {
        identity: user.id,
        name: student.full_name,
        ttl: "2h",
      }
    );

    // Students can watch and listen.
    // They cannot publish microphone or camera tracks by default.
    const tokenGrant = {
      roomJoin: true,
      room: roomName,
      canPublish: false,
      canSubscribe: true,
      canPublishData: false,
    };

    accessToken.addGrant(tokenGrant);

    const token = await accessToken.toJwt();

    return NextResponse.json(
      {
        token,
        serverUrl: livekitUrl,
        roomName,
        tutorial: {
          id: tutorial.id,
          title: tutorial.title,
          subject: tutorial.subject,
          scheduledStart: tutorial.scheduled_start,
          scheduledEnd: tutorial.scheduled_end,
        },
        permissions: {
          canWatchTeacher: true,
          canHearTeacher: true,
          canUseMicrophone: false,
          canUseCamera: false,
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Student classroom token creation failed:", error);

    return jsonError(
      "The live classroom could not be opened. Please try again.",
      500
    );
  }
}
