
import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
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
    return jsonError("Please sign in to your approved teacher account.", 401);
  }

  const livekitUrl = process.env.LIVEKIT_URL;
  const livekitApiKey = process.env.LIVEKIT_API_KEY;
  const livekitApiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
    return jsonError("The live classroom service is not configured yet.", 503);
  }

  try {
    const admin = createAdminClient();

    const { data: teacher, error: teacherError } = await admin
      .from("platform_live_teachers")
      .select("id, full_name, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (teacherError) {
      console.error("Teacher verification failed:", teacherError.message);
      return jsonError("Your teacher access could not be verified.", 503);
    }

    if (!teacher || teacher.status !== "approved") {
      return jsonError(
        "Only approved MICAN teachers can enter this classroom.",
        403
      );
    }

    const { data: assignment, error: assignmentError } = await admin
      .from("live_tutorial_teacher_assignments")
      .select("id")
      .eq("teacher_id", teacher.id)
      .eq("tutorial_id", tutorialId)
      .maybeSingle();

    if (assignmentError) {
      console.error("Assignment verification failed:", assignmentError.message);
      return jsonError("Your tutorial assignment could not be verified.", 503);
    }

    if (!assignment) {
      return jsonError(
        "This tutorial has not been assigned to your account.",
        403
      );
    }

    const { data: tutorial, error: tutorialError } = await admin
      .from("live_tutorials")
      .select("id, title, scheduled_start, scheduled_end, status")
      .eq("id", tutorialId)
      .maybeSingle();

    if (tutorialError) {
      console.error("Tutorial lookup failed:", tutorialError.message);
      return jsonError("The tutorial could not be loaded.", 503);
    }

    if (!tutorial || tutorial.status !== "published") {
      return jsonError("This tutorial is not currently available.", 404);
    }

    const now = Date.now();
    const start = new Date(tutorial.scheduled_start).getTime();
    const end = new Date(tutorial.scheduled_end).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return jsonError("The tutorial schedule is invalid.", 409);
    }

    const earlyJoinWindow = 15 * 60 * 1000;

    if (now < start - earlyJoinWindow) {
      return jsonError(
        "The classroom will open 15 minutes before its scheduled start.",
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
        name: teacher.full_name,
        ttl: "2h",
      }
    );

    accessToken.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await accessToken.toJwt();

    return NextResponse.json({
      token,
      serverUrl: livekitUrl,
      roomName,
      tutorial: {
        id: tutorial.id,
        title: tutorial.title,
        scheduledStart: tutorial.scheduled_start,
        scheduledEnd: tutorial.scheduled_end,
      },
    });
  } catch (error) {
    console.error("Live classroom token creation failed:", error);

    return jsonError(
      "The live classroom could not be started. Please try again.",
      500
    );
  }
}
