
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ tutorialId: string }>;
};

export default async function StudentTutorialDetailsPage({
  params,
}: PageProps) {
  const { tutorialId } = await params;

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

  if (student.must_change_password) {
    redirect("/student/change-password");
  }

  const { data: school } = await admin
    .from("schools")
    .select("id")
    .eq("id", student.school_id)
    .eq("status", "approved")
    .maybeSingle();

  if (!school) {
    redirect("/student/sign-in");
  }

  const { data: enrolment, error: enrolmentError } = await admin
    .from("live_tutorial_school_enrolments")
    .select("id")
    .eq("school_id", student.school_id)
    .eq("tutorial_id", tutorialId)
    .eq("status", "participating")
    .maybeSingle();

  if (enrolmentError) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h1 className="text-xl font-bold">Tutorial unavailable</h1>
          <p className="mt-3 text-slate-400">
            We could not verify your school's participation. Please try again.
          </p>
          <Link
            href="/student/dashboard"
            className="mt-5 inline-block text-blue-400"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!enrolment) {
    notFound();
  }

  const { data: tutorial, error: tutorialError } = await admin
    .from("live_tutorials")
    .select(
      "id, title, subject, topic, description, scheduled_start, scheduled_end, status"
    )
    .eq("id", tutorialId)
    .eq("status", "published")
    .maybeSingle();

  if (tutorialError) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h1 className="text-xl font-bold">Tutorial temporarily unavailable</h1>
          <p className="mt-3 text-slate-400">
            Please refresh the page and try again.
          </p>
        </div>
      </main>
    );
  }

  if (!tutorial) {
    notFound();
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    }).format(new Date(value));
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/student/dashboard"
          className="text-sm font-semibold text-blue-400 hover:text-blue-300"
        >
          ← Back to Student Dashboard
        </Link>

        <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
            MICAN LIVE LEARNING
          </p>

          <h1 className="mt-4 text-3xl font-bold">
            {tutorial.title}
          </h1>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-950 px-3 py-1 text-sm text-blue-300">
              {tutorial.subject}
            </span>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
              {tutorial.topic}
            </span>
          </div>

          <div className="mt-8 space-y-5">
            <div>
              <h2 className="font-semibold text-white">About this tutorial</h2>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-300">
                {tutorial.description || "No additional description has been provided."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
              <h2 className="font-semibold">Scheduled session</h2>

              <p className="mt-4 text-sm text-slate-400">Start time</p>
              <p className="mt-1 font-medium">
                {formatDate(tutorial.scheduled_start)}
              </p>

              <p className="mt-4 text-sm text-slate-400">End time</p>
              <p className="mt-1 font-medium">
                {formatDate(tutorial.scheduled_end)}
              </p>

              <p className="mt-4 text-xs text-slate-500">
                Times are displayed in Nigeria time (WAT).
              </p>
            </div>

            <div className="rounded-xl border border-emerald-800 bg-emerald-950/30 p-5">
              <p className="font-semibold text-emerald-300">
                Your school is participating
              </p>
              <p className="mt-2 text-sm text-slate-300">
                This tutorial is available to students in your school.
                Classroom access will be provided through the student portal.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
