
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ChangePasswordForm from "./change-password-form";

export const dynamic = "force-dynamic";

export default async function StudentChangePasswordPage() {
  const supabase = await createClient();

  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/student/sign-in");
  }

  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, school_id, must_change_password")
    .eq("auth_user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (studentError || !student) {
    redirect("/student/sign-in");
  }

  const { data: school, error: schoolError } = await admin
    .from("schools")
    .select("id")
    .eq("id", student.school_id)
    .eq("status", "approved")
    .maybeSingle();

  if (schoolError || !school) {
    redirect("/student/sign-in");
  }

  if (!student.must_change_password) {
    redirect("/student/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold tracking-widest text-blue-400">
            MICAN SCHOOLS CONNECT
          </p>

          <h1 className="mt-4 text-2xl font-bold text-white">
            Set Your New Password
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            This is your first login. Create a new password before entering
            your student dashboard.
          </p>
        </div>

        <ChangePasswordForm />
      </div>
    </main>
  );
}
