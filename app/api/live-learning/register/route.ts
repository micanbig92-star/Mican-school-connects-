
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function response(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function POST(request: NextRequest) {
  // Accept requests only from this website.
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return response("Invalid request origin.", 403);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return response("Invalid request format.", 415);
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return response("Invalid registration details.", 400);
  }

  const fullName =
    typeof body.fullName === "string" ? body.fullName.trim() : "";

  const email =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

  const phone =
    typeof body.phone === "string" ? body.phone.trim() : "";

  const subject =
    typeof body.subjectSpecialisation === "string"
      ? body.subjectSpecialisation.trim()
      : "";

  const password =
    typeof body.password === "string" ? body.password : "";

  if (fullName.length < 2 || fullName.length > 160) {
    return response("Enter a valid full name.", 400);
  }

  if (
    email.length < 3 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return response("Enter a valid email address.", 400);
  }

  if (phone.length < 7 || phone.length > 40) {
    return response("Enter a valid phone number.", 400);
  }

  if (subject.length > 160) {
    return response("Subject specialisation is too long.", 400);
  }

  if (password.length < 10 || password.length > 72) {
    return response("Password must contain 10–72 characters.", 400);
  }

  let admin;

  try {
    admin = createAdminClient();
  } catch {
    return response("Registration is temporarily unavailable.", 500);
  }

  // Create the account on the server. Email confirmation is intentionally
  // enabled here because this teacher application does not use email
  // verification. The teacher still remains pending until Super Admin approval.
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

  if (authError || !authData.user) {
    return response(
      "We could not create this account. Check the details or try another email address.",
      400
    );
  }

  const { error: insertError } = await admin
    .from("platform_live_teachers")
    .insert({
      user_id: authData.user.id,
      full_name: fullName,
      email,
      phone,
      subject_specialisation: subject || null,
      status: "pending",
    });

  if (insertError) {
    // Remove the Auth account if its teacher application could not be saved.
    await admin.auth.admin.deleteUser(authData.user.id);

    console.error("Teacher application could not be saved.");

    return response(
      "We could not complete your application. Please try again.",
      500
    );
  }

  return NextResponse.json(
    {
      ok: true,
      message:
        "Your account has been created. Your application is waiting for MICAN Super Admin approval.",
    },
    {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
