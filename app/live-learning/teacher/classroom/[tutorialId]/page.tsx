
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ClassroomRoom from "./classroom-room";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tutorialId: string }>;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TeacherClassroomPage({ params }: Props) {
  const { tutorialId } = await params;

  if (!UUID.test(tutorialId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/live-learning/sign-in");
  }

  const admin = createAdminClient();

  const { data: teacher, error: teacherError } = await admin
    .from("platform_live_teachers")
    .select("id, full_name, status, archived_at, deleted_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    teacherError ||
    !teacher ||
    teacher.status !== "approved" ||
    teacher.archived_at ||
    teacher.deleted_at
  ) {
    redirect("/live-learning/teacher");
  }

  const { data: assignment, error: assignmentError } = await admin
    .from("live_tutorial_teacher_assignments")
    .select("id")
    .eq("teacher_id", teacher.id)
    .eq("tutorial_id", tutorialId)
    .maybeSingle();

  if (assignmentError || !assignment) {
    redirect("/live-learning/teacher");
  }

  const { data: tutorial, error: tutorialError } = await admin
    .from("live_tutorials")
    .select("id, title, subject, topic, scheduled_start, scheduled_end, status")
    .eq("id", tutorialId)
    .maybeSingle();

  if (tutorialError || !tutorial || tutorial.status !== "published") {
    notFound();
  }

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-NG", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    }).format(new Date(value));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/live-learning/teacher"
          className="text-sm text-cyan-300 hover:text-cyan-200"
        >
          ← Back to Teacher Workspace
        </Link>

        <header className="mb-6 mt-5">
          <p className="text-xs font-bold tracking-[0.25em] text-cyan-400">
            MICAN LIVE LEARNING
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            {tutorial.title}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {tutorial.subject} · {tutorial.topic}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Scheduled: {formatDate(tutorial.scheduled_start)}
          </p>
        </header>

        <ClassroomRoom tutorialId={tutorial.id} />
      </div>
    </main>
  );
}
