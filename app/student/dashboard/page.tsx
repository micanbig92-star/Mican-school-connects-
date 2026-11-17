
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const supabase = await createClient();

  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/student/sign-in");
  }

  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select(
      "id, school_id, class_id, full_name, admission_number, must_change_password"
    )
    .eq("auth_user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (studentError || !student) {
    redirect("/student/sign-in");
  }

  if (student.must_change_password) {
    redirect("/student/change-password");
  }

  const { data: school, error: schoolError } = await admin
    .from("schools")
    .select("school_name, status")
    .eq("id", student.school_id)
    .eq("status", "approved")
    .maybeSingle();

  if (schoolError || !school) {
    redirect("/student/sign-in");
  }

  let className = "Not assigned";

  if (student.class_id) {
    const { data: schoolClass } = await admin
      .from("school_classes")
      .select("class_name, arm, academic_year")
      .eq("id", student.class_id)
      .eq("school_id", student.school_id)
      .maybeSingle();

    if (schoolClass) {
      className = `${schoolClass.class_name} ${schoolClass.arm || ""}`.trim();
    }
  }

  const { data: enrolments } = await admin
    .from("live_tutorial_school_enrolments")
    .select("tutorial_id")
    .eq("school_id", student.school_id)
    .eq("status", "participating");

  const tutorialIds = (enrolments || []).map(
    (enrolment) => enrolment.tutorial_id
  );

  let tutorials: {
    id: string;
    title: string;
    subject: string;
    topic: string;
    scheduled_start: string;
    scheduled_end: string;
  }[] = [];

  if (tutorialIds.length > 0) {
    const { data: tutorialData } = await admin
      .from("live_tutorials")
      .select(
        "id, title, subject, topic, scheduled_start, scheduled_end"
      )
      .in("id", tutorialIds)
      .eq("status", "published")
      .order("scheduled_start", { ascending: true });

    tutorials = tutorialData || [];
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <p className="text-sm font-bold tracking-widest text-blue-400">
            MICAN SCHOOLS CONNECT
          </p>

          <h1 className="mt-4 text-3xl font-bold">
            Student Dashboard
          </h1>

          <p className="mt-2 text-slate-400">
            Welcome, {student.full_name}.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-xs text-slate-400">School</p>
              <p className="mt-1 font-semibold">{school.school_name}</p>
            </div>

            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-xs text-slate-400">Class</p>
              <p className="mt-1 font-semibold">{className}</p>
            </div>

            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-xs text-slate-400">Admission number</p>
              <p className="mt-1 font-semibold">
                {student.admission_number}
              </p>
            </div>

            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-xs text-slate-400">Learning tutorials</p>
              <p className="mt-1 font-semibold">
                {tutorials.length} available
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">MICAN LIVE LEARNING</h2>

          <p className="mt-2 text-sm text-slate-400">
            Tutorials your school has chosen to participate in.
          </p>

          {tutorials.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-800 p-5 text-sm text-slate-400">
              No live tutorials are currently available for your school.
              Check again later for new learning sessions.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {tutorials.map((tutorial) => (
                <article
                  key={tutorial.id}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-5"
                >
                  <h3 className="text-lg font-semibold">
                    {tutorial.title}
                  </h3>

                  <p className="mt-1 text-sm text-blue-300">
                    {tutorial.subject} — {tutorial.topic}
                  </p>

                  <p className="mt-3 text-sm text-slate-400">
                    Starts:{" "}
                    {new Date(tutorial.scheduled_start).toLocaleString(
                      "en-NG",
                      { timeZone: "Africa/Lagos" }
                    )}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Ends:{" "}
                    {new Date(tutorial.scheduled_end).toLocaleString(
                      "en-NG",
                      { timeZone: "Africa/Lagos" }
                    )}
                  </p>

                  <Link
                    href={`/student/tutorials/${tutorial.id}`}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    View Tutorial Details →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="font-semibold">Learning Materials</h2>
            <p className="mt-2 text-sm text-slate-400">
              Your school learning materials will appear here.
            </p>
            <p className="mt-3 text-xs text-blue-300">Coming soon</p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="font-semibold">Tutorial History</h2>
            <p className="mt-2 text-sm text-slate-400">
              Your previous learning sessions will appear here.
            </p>
            <p className="mt-3 text-xs text-blue-300">Coming soon</p>
          </div>
        </section>
      </div>
    </main>
  );
}
