
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import StudentClassroomRoom from "./classroom-room";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ tutorialId: string }>;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function StudentClassroomPage({
  params,
}: PageProps) {
  const { tutorialId } = await params;

  if (!UUID.test(tutorialId)) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/student/sign-in");
  }

  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, school_id, full_name, status, must_change_password")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (studentError || !student || student.status !== "active") {
    redirect("/student/sign-in");
  }

  if (student.must_change_password) {
    redirect("/student/change-password");
  }

  const { data: school, error: schoolError } = await admin
    .from("schools")
    .select("id, school_name, status")
    .eq("id", student.school_id)
    .maybeSingle();

  if (schoolError || !school || school.status !== "approved") {
    redirect("/student/sign-in");
  }

  const { data: enrolment, error: enrolmentError } = await admin
    .from("live_tutorial_school_enrolments")
    .select("id, status")
    .eq("school_id", student.school_id)
    .eq("tutorial_id", tutorialId)
    .maybeSingle();

  if (enrolmentError) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h1 className="text-xl font-bold">
            Classroom access unavailable
          </h1>
          <p className="mt-3 text-slate-400">
            We could not verify your school's participation. Please try again.
          </p>
          <Link
            href="/student/dashboard"
            className="mt-5 inline-block text-blue-400"
          >
            Return to Student Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!enrolment || enrolment.status !== "participating") {
    notFound();
  }

  const { data: tutorial, error: tutorialError } = await admin
    .from("live_tutorials")
    .select(
      "id, title, subject, topic, scheduled_start, scheduled_end, status"
    )
    .eq("id", tutorialId)
    .maybeSingle();

  if (tutorialError) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h1 className="text-xl font-bold">
            Tutorial temporarily unavailable
          </h1>
          <p className="mt-3 text-slate-400">
            Please refresh the page and try again.
          </p>
        </div>
      </main>
    );
  }

  if (!tutorial || tutorial.status !== "published") {
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
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/student/tutorials/${tutorialId}`}
          className="text-sm font-semibold text-blue-400 hover:text-blue-300"
        >
          ← Back to Tutorial Details
        </Link>

        <header className="mb-6 mt-5">
          <p className="text-xs font-bold tracking-[0.25em] text-blue-400">
            MICAN LIVE LEARNING
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            {tutorial.title}
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            {tutorial.subject} · {tutorial.topic}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {formatDate(tutorial.scheduled_start)} (Nigeria time)
          </p>
        </header>

        <div className="mb-5 rounded-xl border border-blue-900 bg-blue-950/30 p-4">
          <p className="font-semibold text-blue-200">
            Welcome, {student.full_name}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            School: {school.school_name}
          </p>
        </div>

        <StudentClassroomRoom tutorialId={tutorial.id} />
      </div>
    </main>
  );
}
