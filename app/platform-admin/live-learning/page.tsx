import { redirect } from "next/navigation";
import Link from "next/link";
import { getPlatformAdmin } from "@/lib/supabase/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createLiveTutorial } from "./actions";

export const dynamic = "force-dynamic";

export default async function LiveLearningAdminPage() {
  const user = await getPlatformAdmin();

  if (!user) {
    redirect("/school-access");
  }

  const admin = createAdminClient();

  const { data: tutorials, error } = await admin
    .from("live_tutorials")
    .select(
      "id, title, subject, topic, description, scheduled_start, scheduled_end, status, created_at"
    )
    .order("scheduled_start", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Unable to load Live Learning
        </h1>
        <p className="mt-2 text-slate-600">
          Please refresh and try again.
        </p>
      </main>
    );
  }

  const allTutorials = tutorials || [];

  function formatDate(value: string) {
    return new Date(value).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    });
  }

  function statusStyle(status: string) {
    if (status === "published") {
      return "bg-emerald-100 text-emerald-700";
    }

    if (status === "cancelled") {
      return "bg-rose-100 text-rose-700";
    }

    if (status === "completed") {
      return "bg-slate-200 text-slate-700";
    }

    return "bg-amber-100 text-amber-800";
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-8 p-5 md:p-9">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
              MICAN TECHNOLOGIES
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
              MICAN LIVE LEARNING
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Manage and schedule tutorials for participating schools.
            </p>
          </div>

          <Link
            href="/platform-admin"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
          >
            ← Back to Super Admin
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
              Tutorial setup
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Create a new live tutorial
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Start by entering the tutorial details and schedule.
            </p>
          </div>

          <form action={createLiveTutorial} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Tutorial title
              </label>

              <input
                name="title"
                required
                minLength={3}
                maxLength={180}
                placeholder="Example: MICAN Mathematics Masterclass"
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-teal-600"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Subject
                </label>

                <input
                  name="subject"
                  required
                  maxLength={120}
                  placeholder="Mathematics"
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Topic
                </label>

                <input
                  name="topic"
                  required
                  maxLength={180}
                  placeholder="Quadratic equations"
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Tutorial description
              </label>

              <textarea
                name="description"
                rows={4}
                maxLength={5000}
                placeholder="Explain what students will learn..."
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-teal-600"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Starting date and time
                </label>

                <input
                  type="datetime-local"
                  name="scheduledStart"
                  required
                  className="w-full rounded-xl border border-slate-300 p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Ending date and time
                </label>

                <input
                  type="datetime-local"
                  name="scheduledEnd"
                  required
                  className="w-full rounded-xl border border-slate-300 p-3"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Initial scheduling uses West Africa Time (WAT).
            </p>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Tutorial status
              </label>

              <select
                name="status"
                defaultValue="draft"
                className="w-full rounded-xl border border-slate-300 bg-white p-3"
              >
                <option value="draft">Save as draft</option>
                <option value="published">Publish tutorial</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-teal-700 px-5 py-4 font-bold text-white hover:bg-teal-800"
            >
              Create tutorial
            </button>
          </form>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
              Tutorial records
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Scheduled tutorials ({allTutorials.length})
            </h2>
          </div>

          {allTutorials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-4xl">🎥</p>

              <h3 className="mt-3 font-bold text-slate-800">
                No tutorials created yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Your tutorials will appear here after creation.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {allTutorials.map((tutorial) => (
                <article
                  key={tutorial.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {tutorial.title}
                      </h3>

                      <p className="mt-1 text-sm text-teal-700">
                        {tutorial.subject} · {tutorial.topic}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(
                        tutorial.status
                      )}`}
                    >
                      {tutorial.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">
                    {tutorial.description || "No description provided."}
                  </p>

                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
                    <p>
                      <strong>Starts:</strong>{" "}
                      {formatDate(tutorial.scheduled_start)}
                    </p>

                    <p>
                      <strong>Ends:</strong>{" "}
                      {formatDate(tutorial.scheduled_end)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          MICAN TECHNOLOGIES · One Network. Many Schools. One Connected Future.
        </footer>
      </div>
    </main>
  );
}