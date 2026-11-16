import { redirect } from "next/navigation";
import Link from "next/link";
import { getPlatformAdmin } from "@/lib/supabase/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createLiveTutorial,
  assignLiveTutorial,
} from "./actions";

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
  created_at: string;
};

type Teacher = {
  id: string;
  full_name: string;
  email: string;
  subject_specialisation: string | null;
  status: string;
};

type Assignment = {
  id: string;
  tutorial_id: string;
  teacher_id: string;
  assigned_at: string;
};

type PageProps = {
  searchParams: Promise<{
    assignment?: string;
  }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });
}

function statusStyle(status: string) {
  if (status === "published") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "cancelled") {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  if (status === "completed") {
    return "bg-slate-100 text-slate-600 ring-slate-200";
  }

  return "bg-amber-50 text-amber-700 ring-amber-200";
}

export default async function LiveLearningAdminPage({
  searchParams,
}: PageProps) {
  const user = await getPlatformAdmin();

  if (!user) redirect("/school-access");

  const params = await searchParams;
  const admin = createAdminClient();

  const [
    { data: tutorials, error: tutorialError },
    { data: teachers, error: teacherError },
    { data: assignments, error: assignmentError },
  ] = await Promise.all([
    admin
      .from("live_tutorials")
      .select(
        "id, title, subject, topic, description, scheduled_start, scheduled_end, status, created_at"
      )
      .order("scheduled_start", { ascending: false }),

    admin
      .from("platform_live_teachers")
      .select("id, full_name, email, subject_specialisation, status")
      .order("full_name", { ascending: true }),

    admin
      .from("live_tutorial_teacher_assignments")
      .select("id, tutorial_id, teacher_id, assigned_at")
      .order("assigned_at", { ascending: false }),
  ]);

  if (tutorialError || teacherError || assignmentError) {
    console.error("Live Learning dashboard loading failed:", {
      tutorialError: tutorialError?.message,
      teacherError: teacherError?.message,
      assignmentError: assignmentError?.message,
    });

    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="text-2xl font-bold">
            Dashboard temporarily unavailable
          </h1>
          <p className="mt-3 text-slate-400">
            We could not load all Live Learning records. Please refresh
            the page and try again.
          </p>
        </div>
      </main>
    );
  }

  const allTutorials = (tutorials || []) as Tutorial[];
  const allTeachers = (teachers || []) as Teacher[];
  const allAssignments = (assignments || []) as Assignment[];

  const approvedTeachers = allTeachers.filter(
    (teacher) => teacher.status === "approved"
  );

  const publishedTutorials = allTutorials.filter(
    (tutorial) => tutorial.status === "published"
  );

  const draftCount = allTutorials.filter(
    (tutorial) => tutorial.status === "draft"
  ).length;

  const publishedCount = publishedTutorials.length;
  const assignmentCount = allAssignments.length;

  const teacherById = new Map(
    allTeachers.map((teacher) => [teacher.id, teacher])
  );

  const assignmentsByTutorial = new Map<string, Assignment[]>();

  for (const assignment of allAssignments) {
    const existing =
      assignmentsByTutorial.get(assignment.tutorial_id) || [];

    existing.push(assignment);
    assignmentsByTutorial.set(assignment.tutorial_id, existing);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-9">

        <header className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 shadow-2xl">
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400 text-xl font-black text-slate-950">
                  M
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-300">
                    MICAN TECHNOLOGIES
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Super Admin Control Centre
                  </p>
                </div>
              </div>

              <h1 className="mt-7 text-3xl font-black tracking-tight sm:text-4xl">
                Live Learning
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Manage live tutorials, assign approved teachers and
                coordinate learning sessions across participating schools.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/platform-admin"
                className="rounded-xl border border-slate-600 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-teal-400"
              >
                ← Super Admin
              </Link>

              <Link
                href="/platform-admin/live-learning/teachers"
                className="rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-300"
              >
                Manage Teachers →
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 bg-black/10 px-6 py-3 text-xs text-slate-400 sm:px-8">
            One Network. Many Schools. One Connected Future.
          </div>
        </header>

        {params.assignment === "success" && (
          <div
            role="status"
            className="rounded-2xl border border-emerald-700/60 bg-emerald-950/50 p-5 text-emerald-200"
          >
            <p className="font-bold">
              Tutorial assigned successfully!
            </p>
            <p className="mt-1 text-sm text-emerald-300/80">
              The assigned tutorial should now appear in the approved
              teacher's workspace.
            </p>
          </div>
        )}

        <section>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
              Overview
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              Learning activity
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Total tutorials</p>
              <p className="mt-3 text-3xl font-black text-white">
                {allTutorials.length}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                All tutorial records
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-900/70 bg-emerald-950/30 p-5">
              <p className="text-sm text-emerald-300">
                Published tutorials
              </p>
              <p className="mt-3 text-3xl font-black text-white">
                {publishedCount}
              </p>
              <p className="mt-2 text-xs text-emerald-200/60">
                Available for assignment
              </p>
            </div>

            <div className="rounded-2xl border border-amber-900/70 bg-amber-950/20 p-5">
              <p className="text-sm text-amber-300">Draft tutorials</p>
              <p className="mt-3 text-3xl font-black text-white">
                {draftCount}
              </p>
              <p className="mt-2 text-xs text-amber-200/60">
                Not yet published
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-900/70 bg-cyan-950/20 p-5">
              <p className="text-sm text-cyan-300">
                Teacher assignments
              </p>
              <p className="mt-3 text-3xl font-black text-white">
                {assignmentCount}
              </p>
              <p className="mt-2 text-xs text-cyan-200/60">
                Recorded assignments
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
                People management
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">
                MICAN Live Learning Teachers
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Review applications and manage teacher approvals.
              </p>
            </div>

            <Link
              href="/platform-admin/live-learning/teachers"
              className="inline-flex justify-center rounded-xl border border-teal-500/50 bg-teal-500/10 px-5 py-3 text-sm font-bold text-teal-300 transition hover:bg-teal-500/20"
            >
              Open Teacher Management →
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-teal-900/70 bg-gradient-to-br from-teal-950/50 to-slate-900 p-5 shadow-xl sm:p-7">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
              Tutorial allocation
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Assign a tutorial to a teacher
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Select a published tutorial and an approved MICAN teacher.
              The assigned tutorial will then appear in that teacher's
              workspace.
            </p>
          </div>

          {publishedTutorials.length === 0 ||
          approvedTeachers.length === 0 ? (
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-5">
              {publishedTutorials.length === 0 && (
                <p className="text-sm text-amber-300">
                  No published tutorials are available. Publish a tutorial
                  before assigning it.
                </p>
              )}

              {approvedTeachers.length === 0 && (
                <p className="mt-2 text-sm text-amber-300">
                  No approved teachers are available. Approve a teacher
                  application before assigning a tutorial.
                </p>
              )}
            </div>
          ) : (
            <form action={assignLiveTutorial} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="tutorialId"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Select published tutorial
                  </label>

                  <select
                    id="tutorialId"
                    name="tutorialId"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white outline-none focus:border-teal-400"
                  >
                    <option value="" disabled>
                      Choose a tutorial
                    </option>

                    {publishedTutorials.map((tutorial) => (
                      <option key={tutorial.id} value={tutorial.id}>
                        {tutorial.title} — {tutorial.subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="teacherId"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Select approved teacher
                  </label>

                  <select
                    id="teacherId"
                    name="teacherId"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white outline-none focus:border-teal-400"
                  >
                    <option value="" disabled>
                      Choose a teacher
                    </option>

                    {approvedTeachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name} —{" "}
                        {teacher.subject_specialisation ||
                          "No subject listed"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <p className="text-xs leading-5 text-slate-400">
                  Security check: the server verifies that the selected
                  tutorial is published and the selected teacher is
                  approved before creating the assignment.
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-400 px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-teal-300 sm:w-auto"
              >
                Assign Tutorial to Teacher →
              </button>
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              Assignment records
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Assigned teachers by tutorial
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              See which teachers have been assigned to each tutorial.
            </p>
          </div>

          {allAssignments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-7 text-center">
              <p className="font-semibold text-white">
                No teacher assignments yet
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Assign a published tutorial to an approved teacher above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allTutorials
                .filter((tutorial) =>
                  assignmentsByTutorial.has(tutorial.id)
                )
                .map((tutorial) => {
                  const tutorialAssignments =
                    assignmentsByTutorial.get(tutorial.id) || [];

                  return (
                    <article
                      key={tutorial.id}
                      className="rounded-xl border border-slate-700 bg-slate-950/70 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-teal-400">
                            {tutorial.subject}
                          </p>
                          <h3 className="mt-1 text-lg font-bold text-white">
                            {tutorial.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-400">
                            {tutorial.topic}
                          </p>
                        </div>

                        <span className="rounded-full bg-cyan-950 px-3 py-1 text-xs font-bold text-cyan-300">
                          {tutorialAssignments.length}{" "}
                          {tutorialAssignments.length === 1
                            ? "teacher"
                            : "teachers"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {tutorialAssignments.map((assignment) => {
                          const teacher = teacherById.get(
                            assignment.teacher_id
                          );

                          return (
                            <div
                              key={assignment.id}
                              className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="font-semibold text-white">
                                  {teacher?.full_name ||
                                    "Teacher record unavailable"}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {teacher?.subject_specialisation ||
                                    "Subject not listed"}
                                  {teacher?.email
                                    ? ` • ${teacher.email}`
                                    : ""}
                                </p>

                                {teacher &&
                                  teacher.status !== "approved" && (
                                    <p className="mt-1 text-xs text-amber-300">
                                      Teacher status: {teacher.status}
                                    </p>
                                  )}
                              </div>

                              <p className="text-xs text-slate-500">
                                Assigned: {formatDate(assignment.assigned_at)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-7">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
              Content management
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Create a new live tutorial
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Prepare a lesson, set its schedule and publish it when ready.
            </p>
          </div>

          <form action={createLiveTutorial} className="space-y-5">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Tutorial title
              </label>

              <input
                id="title"
                name="title"
                required
                minLength={3}
                maxLength={180}
                placeholder="Example: MICAN Mathematics Masterclass"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white outline-none focus:border-teal-400"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Subject
                </label>

                <input
                  id="subject"
                  name="subject"
                  required
                  maxLength={120}
                  placeholder="Mathematics"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label
                  htmlFor="topic"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Topic
                </label>

                <input
                  id="topic"
                  name="topic"
                  required
                  maxLength={180}
                  placeholder="Quadratic equations"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Tutorial description
              </label>

              <textarea
                id="description"
                name="description"
                rows={4}
                maxLength={5000}
                placeholder="Explain what students will learn..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white outline-none focus:border-teal-400"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="scheduledStart"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Starting date and time
                </label>

                <input
                  id="scheduledStart"
                  type="datetime-local"
                  name="scheduledStart"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label
                  htmlFor="scheduledEnd"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Ending date and time
                </label>

                <input
                  id="scheduledEnd"
                  type="datetime-local"
                  name="scheduledEnd"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Initial scheduling uses West Africa Time (WAT).
            </p>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Tutorial status
              </label>

              <select
                id="status"
                name="status"
                defaultValue="draft"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white outline-none focus:border-teal-400"
              >
                <option value="draft">Save as draft</option>
                <option value="published">Publish tutorial</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-teal-100"
            >
              Create Tutorial
            </button>
          </form>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
              Tutorial records
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Scheduled tutorials
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Review all created tutorials and their publication status.
            </p>
          </div>

          {allTutorials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center">
              <p className="text-4xl">🎥</p>
              <h3 className="mt-3 font-bold text-white">
                No tutorials created yet
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                New tutorials will appear here after creation.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {allTutorials.map((tutorial) => (
                <article
                  key={tutorial.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-600"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-teal-400">
                        {tutorial.subject}
                      </p>

                      <h3 className="mt-2 text-lg font-bold text-white">
                        {tutorial.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {tutorial.topic}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusStyle(
                        tutorial.status
                      )}`}
                    >
                      {tutorial.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                    {tutorial.description || "No description provided."}
                  </p>

                  <div className="mt-5 grid gap-4 border-t border-slate-800 pt-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Starts</p>
                      <p className="mt-1 text-slate-200">
                        {formatDate(tutorial.scheduled_start)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Ends</p>
                      <p className="mt-1 text-slate-200">
                        {formatDate(tutorial.scheduled_end)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-800 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Assigned teachers
                    </p>

                    {assignmentsByTutorial.has(tutorial.id) ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(
                          assignmentsByTutorial.get(tutorial.id) || []
                        ).map((assignment) => {
                          const teacher = teacherById.get(
                            assignment.teacher_id
                          );

                          return (
                            <span
                              key={assignment.id}
                              className="rounded-lg border border-teal-900 bg-teal-950/50 px-3 py-2 text-xs font-semibold text-teal-200"
                            >
                              {teacher?.full_name || "Teacher unavailable"}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        No teacher assigned yet.
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-slate-800 py-7 text-center">
          <p className="text-xs font-bold tracking-widest text-slate-400">
            MICAN TECHNOLOGIES
          </p>
          <p className="mt-2 text-xs text-slate-600">
            One Network. Many Schools. One Connected Future.
          </p>
        </footer>
      </div>
    </main>
  );
}