
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Tutorial = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  description: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
};

function formatNigeriaDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function getSessionLabel(start: string, end: string) {
  const now = Date.now();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (now < startTime) return "Upcoming";
  if (now <= endTime) return "In progress";
  return "Session ended";
}

export default async function TeacherDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/live-learning/sign-in");
  }

  let admin;

  try {
    admin = createAdminClient();
  } catch {
    return (
      <main className="signin-page">
        <div className="signin-shell">
          <div className="signin-card">
            <h1 className="text-2xl font-bold">
              Workspace temporarily unavailable
            </h1>
            <p className="mt-3 text-slate-400">
              We cannot connect to the teacher workspace right now.
              Please try again later.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { data: teacher, error: teacherError } = await admin
    .from("platform_live_teachers")
    .select(
      "id, full_name, status, subject_specialisation, archived_at, deleted_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

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
              This account does not have a MICAN Live Learning teacher application.
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

  // Archived or trashed teachers must not enter their workspace.
  if (teacher.archived_at || teacher.deleted_at) {
    return (
      <main className="signin-page">
        <div className="signin-shell">
          <div className="signin-card">
            <h1 className="text-2xl font-bold">
              Teacher access unavailable
            </h1>
            <p className="mt-3 text-slate-400">
              This teacher account has been archived or moved to Trash.
              Please contact MICAN Super Admin if you believe this is a mistake.
            </p>
          </div>
        </div>
      </main>
    );
  }

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
              by the MICAN Super Admin.
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
              Your MICAN Live Learning teacher application was not approved.
              Please contact MICAN Technologies.
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
              Your teacher workspace is currently suspended.
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

  const { data: assignments, error: assignmentError } = await admin
    .from("live_tutorial_teacher_assignments")
    .select("tutorial_id, assigned_at")
    .eq("teacher_id", teacher.id)
    .order("assigned_at", { ascending: false });

  let tutorials: Tutorial[] = [];
  let tutorialError: string | null = null;

  if (assignmentError) {
    tutorialError =
      "We could not load your tutorial assignments. Please refresh the page.";
  } else {
    const tutorialIds = (assignments ?? []).map(
      (item) => item.tutorial_id
    );

    if (tutorialIds.length > 0) {
      const result = await admin
        .from("live_tutorials")
        .select(
          "id, title, subject, topic, description, scheduled_start, scheduled_end, status"
        )
        .in("id", tutorialIds)
        .eq("status", "published")
        .order("scheduled_start", { ascending: true });

      if (result.error) {
        tutorialError =
          "Your assignments were found, but tutorial details could not be loaded.";
      } else {
        tutorials = (result.data ?? []) as Tutorial[];
      }
    }
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

          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">
                  Assigned Tutorials
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Published lessons assigned by MICAN Super Admin.
                </p>
              </div>

              <span className="rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-300">
                {tutorials.length} available
              </span>
            </div>

            {tutorialError ? (
              <div className="mt-5 rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">
                {tutorialError}
              </div>
            ) : tutorials.length === 0 ? (
              <div className="mt-5 rounded-lg border border-slate-700 bg-slate-900/40 p-5">
                <h3 className="font-semibold">
                  No published tutorials yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  When MICAN Super Admin assigns a tutorial to you
                  and publishes it, it will appear here with its
                  subject, topic and scheduled time.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {tutorials.map((tutorial) => {
                  const sessionLabel = getSessionLabel(
                    tutorial.scheduled_start,
                    tutorial.scheduled_end
                  );

                  return (
                    <article
                      key={tutorial.id}
                      className="rounded-xl border border-slate-700 bg-slate-900/40 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                            {tutorial.subject}
                          </p>
                          <h3 className="mt-2 text-lg font-bold">
                            {tutorial.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-300">
                            Topic: {tutorial.topic}
                          </p>
                        </div>

                        <span className="rounded-full border border-cyan-800 px-3 py-1 text-xs text-cyan-300">
                          {sessionLabel}
                        </span>
                      </div>

                      {tutorial.description ? (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                          {tutorial.description}
                        </p>
                      ) : null}

                      <div className="mt-4 grid gap-3 border-t border-slate-700 pt-4 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-slate-500">Starts</p>
                          <p className="mt-1 text-slate-200">
                            {formatNigeriaDate(tutorial.scheduled_start)}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Ends</p>
                          <p className="mt-1 text-slate-200">
                            {formatNigeriaDate(tutorial.scheduled_end)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-slate-700 pt-4">
                        <Link
                          href={`/live-learning/teacher/classroom/${tutorial.id}`}
                          className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
                        >
                          Join Live Classroom →
                        </Link>

                        <p className="mt-2 text-center text-xs text-slate-500">
                          Classroom entry is checked securely when you join.
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <div className="mt-8 rounded-lg border border-slate-700 p-4">
            <h2 className="font-bold">MICAN Live Classroom</h2>
            <p className="mt-2 text-sm text-slate-400">
              Your assigned tutorials now have classroom access.
              The scheduled session window is checked by the secure
              classroom token service.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
