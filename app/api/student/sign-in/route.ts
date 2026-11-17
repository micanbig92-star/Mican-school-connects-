
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function failure(message: string, status: number) {
  return NextResponse.json(
    { ok: false, message },
    {
      status,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return failure("Invalid sign-in request.", 403);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return failure("Invalid request format.", 415);
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return failure("Enter your username and password.", 400);
  }

  const username =
    typeof body.username === "string" ? body.username.trim() : "";
  const password =
    typeof body.password === "string" ? body.password : "";

  if (
    username.length < 10 ||
    username.length > 100 ||
    !username.includes("/") ||
    password.length < 1 ||
    password.length > 72
  ) {
    return failure("Username or password is incorrect.", 401);
  }

  const separator = username.indexOf("/");
  const schoolCode = username.slice(0, separator).trim().toUpperCase();
  const admissionNumber = username.slice(separator + 1).trim();

  if (!/^MSC-[A-F0-9]{8}$/.test(schoolCode) || !admissionNumber) {
    return failure("Username or password is incorrect.", 401);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return failure("Student sign-in is temporarily unavailable.", 500);
  }

  let admin;

  try {
    admin = createAdminClient();
  } catch {
    return failure("Student sign-in is temporarily unavailable.", 500);
  }

  const { data: school } = await admin
    .from("schools")
    .select("id")
    .eq("school_code", schoolCode)
    .eq("status", "approved")
    .maybeSingle();

  if (!school) {
    return failure("Username or password is incorrect.", 401);
  }

  const { data: student } = await admin
    .from("students")
    .select("id, auth_user_id, must_change_password")
    .eq("school_id", school.id)
    .eq("admission_number", admissionNumber)
    .eq("status", "active")
    .not("auth_user_id", "is", null)
    .maybeSingle();

  if (!student?.auth_user_id) {
    return failure("Username or password is incorrect.", 401);
  }

  const { data: authData, error: authLookupError } =
    await admin.auth.admin.getUserById(student.auth_user_id);

  const loginEmail = authData.user?.email;

  if (authLookupError || !loginEmail) {
    return failure("Username or password is incorrect.", 401);
  }

  const response = NextResponse.json(
    {
      ok: true,
      mustChangePassword: student.must_change_password,
      redirectTo: student.must_change_password
        ? "/student/change-password"
        : "/student/dashboard",
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  });

  if (signInError) {
    return failure("Username or password is incorrect.", 401);
  }

  return response;
}
