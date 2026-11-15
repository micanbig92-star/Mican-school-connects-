
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  // First, verify the signed-in user using their server session.
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/live-learning/sign-in");
  }

  // Check the teacher's actual application record on the server.
  const admin = createAdminClient();

  const { data: teacher, error: teacherError } = await admin
    .from("platform_live_teachers")
    .select("full_name, status, subject_specialisation")
    .eq("user_id", user.id)
    .maybeSingle();

  // Fail closed if the database cannot verify the application.
  if (teacherError) {
    return (
      <main className="signin-page">
        <div className="signin-shell">
          <div className="signin-card">
            <h1 className="text-2xl font-bold">
              Unable to verify your account
            </h1>
            <p className="mt-3 text-slate-400">
              We cannot check your teacher approval right now.
              Please try again later.
            </p>
            <Link
              href="/live-learning/sign-in"
              className="mt-6 inline-block text-cyan-400"
            >
              Return to teacher sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!teacher) {
    return (
      <main className="signin-page">
        <div className="signin-shell">
          <div className="signin-card">
            <h1 className="text-2xl font-bold">
              Teacher access not found
            </h1>
            <p className="mt-3 text-slate-400">
              This account does not have a MICAN Live Learning
              teacher application.
            </p>
            <Link
              href="/live-learning/register"
              className="mt-6 inline-block text-cyan-400"
            >
              Apply as a teacher
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Pending applications cannot enter the teacher workspace.
  if (teacher.status === "pending") {
    return (
      <main className="signin-page">
        <div className="signin-shell">
          <div className="signin-card">
            <p className="text-cyan-400 font-bold tracking-widest text-sm">
              MICAN LIVE LEARNING
            </p>
            <h1 className="mt-4 text-2xl font-bold">
              Application awaiting approval
            </h1>
            <p className="mt-3 text-slate-300">
              Welcome, {teacher.full_name}.
            </p>
            <p className="mt-3 text-slate-400">
              Your teacher application is still being reviewed
              by the MICAN Super Admin. Your teacher dashboard
              will become available after approval.
            </p>
            <p className="mt-5 text-sm text-amber-400">
              Status: Pending
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (teacher.status === "rejected") {
    return (
      <main className="signin-page">
        <div className="signin-shell">
          <div className="signin-card">
            <h1 className="text-2xl font-bold">
              Application not approved
            </h1>
            <p className="mt-3 text-slate-400">
              Your MICAN Live Learning teacher application
              was not approved. Please contact MICAN
              Technologies for further information.
            </p>
            <p className="mt-5 text-sm text-red-400">
              Status: Rejected
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (teacher.status === "suspended") {
    return (
      <main className="signin-page">
        <div className="signin-shell">
          <div className="signin-card">
            <h1 className="text-2xl font-bold">
              Teacher access suspended
            </h1>
            <p className="mt-3 text-slate-400">
              Access to your MICAN Live Learning teacher
              workspace is currently suspended.
              Please contact MICAN Technologies.
            </p>
            <p className="mt-5 text-sm text-red-400">
              Status: Suspended
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Only an approved teacher reaches this section.
  if (teacher.status !== "approved") {
    return (
      <main className="signin-page">
        <div className="signin-shell">
          <div className="signin-card">
            <h1 className="text-2xl font-bold">
              Access unavailable
            </h1>
            <p className="mt-3 text-slate-400">
              Your account status could not be accepted.
              Please contact MICAN Technologies.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="signin-page">
      <div className="signin-shell">
        <div className="signin-card">
          <p className="text-cyan-400 font-bold tracking-widest text-sm">
            MICAN LIVE LEARNING
          </p>

          <h1 className="mt-4 text-3xl font-bold">
            Teacher Workspace
          </h1>

          <p className="mt-3 text-slate-300">
            Welcome, {teacher.full_name}.
          </p>

          <div className="mt-6 rounded-lg border border-emerald-700 bg-emerald-950/40 p-4">
            <p className="font-semibold text-emerald-400">
              Teacher account approved
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Your account has been approved by MICAN Super Admin.
            </p>
          </div>

          <div className="mt-6">
            <p className="text-sm text-slate-400">
              Subject specialisation
            </p>
            <p className="mt-1 font-medium">
              {teacher.subject_specialisation || "Not specified"}
            </p>
          </div>

          <div className="mt-8 rounded-lg border border-slate-700 p-4">
            <h2 className="font-bold">Teacher dashboard setup</h2>
            <p className="mt-2 text-sm text-slate-400">
              Your secure teacher workspace is ready for the
              next development stage. Assigned tutorials,
              live classroom tools and learning materials
              will be added next.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
