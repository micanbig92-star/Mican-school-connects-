
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPlatformAdmin } from "@/lib/supabase/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createLiveTutorial, assignLiveTutorial } from "./actions";

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
  payment_required: boolean;
  price_amount: number | null;
  price_currency: string;
  payment_method: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  payment_instructions: string | null;
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
  searchParams: Promise<{ assignment?: string }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });
}

function statusStyle(status: string) {
  if (status === "published") return "bg-emerald-950 text-emerald-300";
  if (status === "cancelled") return "bg-rose-950 text-rose-300";
  if (status === "completed") return "bg-slate-800 text-slate-300";
  return "bg-amber-950 text-amber-300";
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
    admin.from("live_tutorials").select(
      "id,title,subject,topic,description,scheduled_start,scheduled_end,status,created_at,payment_required,price_amount,price_currency,payment_method,bank_name,account_name,account_number,payment_instructions"
    ).order("scheduled_start", { ascending: false }),

    admin.from("platform_live_teachers").select(
      "id,full_name,email,subject_specialisation,status"
    ).order("full_name", { ascending: true }),

    admin.from("live_tutorial_teacher_assignments").select(
      "id,tutorial_id,teacher_id,assigned_at"
    ).order("assigned_at", { ascending: false }),
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
          <h1 className="text-2xl font-bold">Dashboard temporarily unavailable</h1>
          <p className="mt-3 text-slate-400">
            We could not load all Live Learning records. Please refresh and try again.
          </p>
        </div>
      </main>
    );
  }

  const allTutorials = (tutorials || []) as Tutorial[];
  const allTeachers = (teachers || []) as Teacher[];
  const allAssignments = (assignments || []) as Assignment[];

  const approvedTeachers = allTeachers.filter(t => t.status === "approved");
  const publishedTutorials = allTutorials.filter(t => t.status === "published");
  const draftCount = allTutorials.filter(t => t.status === "draft").length;

  const teacherById = new Map(allTeachers.map(t => [t.id, t]));
  const assignmentsByTutorial = new Map<string, Assignment[]>();

  for (const assignment of allAssignments) {
    const existing = assignmentsByTutorial.get(assignment.tutorial_id) || [];
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400 text-xl font-black text-slate-950">M</div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-300">MICAN TECHNOLOGIES</p>
                  <p className="mt-1 text-xs text-slate-400">Super Admin Control Centre</p>
                </div>
              </div>
              <h1 className="mt-7 text-3xl font-black sm:text-4xl">Live Learning</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Create tutorials, set payment instructions, assign approved teachers and manage learning sessions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/platform-admin" className="rounded-xl border border-slate-600 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-white">
                ← Super Admin
              </Link>
              <Link href="/platform-admin/live-learning/teachers" className="rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950">
                Manage Teachers →
              </Link>
              <Link href="/platform-admin/live-learning/payments" className="rounded-xl border border-amber-400/50 bg-amber-400/10 px-5 py-3 text-sm font-bold text-amber-200 hover:bg-amber-400/20">
                Review School Payments →
              </Link>
            </div>
          </div>
          <div className="border-t border-white/10 px-6 py-3 text-xs text-slate-400">
            One Network. Many Schools. One Connected Future.
          </div>
        </header>

        {params.assignment === "success" && (
          <div role="status" className="rounded-2xl border border-emerald-700 bg-emerald-950/50 p-5 text-emerald-200">
            <p className="font-bold">Tutorial assigned successfully!</p>
            <p className="mt-1 text-sm">The tutorial should now appear in the approved teacher's workspace.</p>
          </div>
        )}

        <section>
          <h2 className="mb-4 text-xl font-bold">Learning activity</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total tutorials", allTutorials.length],
              ["Published tutorials", publishedTutorials.length],
              ["Draft tutorials", draftCount],
              ["Teacher assignments", allAssignments.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-3 text-3xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <h2 className="text-xl font-bold">MICAN Live Learning Teachers</h2>
          <p className="mt-2 text-sm text-slate-400">Review applications and manage teacher approvals.</p>
          <Link href="/platform-admin/live-learning/teachers" className="mt-4 inline-flex rounded-xl border border-teal-500/50 bg-teal-500/10 px-5 py-3 text-sm font-bold text-teal-300">
            Open Teacher Management →
          </Link>
        </section>

        <section className="rounded-2xl border border-teal-900/70 bg-gradient-to-br from-teal-950/50 to-slate-900 p-5 sm:p-7">
          <h2 className="text-2xl font-bold">Assign a tutorial to a teacher</h2>
          <p className="mt-2 text-sm text-slate-400">Select a published tutorial and an approved MICAN teacher.</p>

          {publishedTutorials.length === 0 || approvedTeachers.length === 0 ? (
            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/60 p-5">
              {publishedTutorials.length === 0 && <p className="text-sm text-amber-300">No published tutorials are available.</p>}
              {approvedTeachers.length === 0 && <p className="mt-2 text-sm text-amber-300">No approved teachers are available.</p>}
            </div>
          ) : (
            <form action={assignLiveTutorial} className="mt-5 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="tutorialId" className="mb-2 block text-sm font-semibold">Select published tutorial</label>
                  <select id="tutorialId" name="tutorialId" required defaultValue="" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white">
                    <option value="" disabled>Choose a tutorial</option>
                    {publishedTutorials.map(t => <option key={t.id} value={t.id}>{t.title} — {t.subject}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="teacherId" className="mb-2 block text-sm font-semibold">Select approved teacher</label>
                  <select id="teacherId" name="teacherId" required defaultValue="" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white">
                    <option value="" disabled>Choose a teacher</option>
                    {approvedTeachers.map(t => <option key={t.id} value={t.id}>{t.full_name} — {t.subject_specialisation || "No subject listed"}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="rounded-xl bg-teal-400 px-6 py-4 text-sm font-black text-slate-950">Assign Tutorial to Teacher →</button>
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <h2 className="text-2xl font-bold">Assigned teachers by tutorial</h2>
          <p className="mt-2 text-sm text-slate-400">See which teachers have been assigned to each tutorial.</p>

          {allAssignments.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-slate-700 p-7 text-center text-slate-400">No teacher assignments yet.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {allTutorials.filter(t => assignmentsByTutorial.has(t.id)).map(tutorial => (
                <article key={tutorial.id} className="rounded-xl border border-slate-700 bg-slate-950/70 p-5">
                  <p className="text-xs font-bold uppercase text-teal-400">{tutorial.subject}</p>
                  <h3 className="mt-1 text-lg font-bold">{tutorial.title}</h3>
                  <div className="mt-4 space-y-3">
                    {(assignmentsByTutorial.get(tutorial.id) || []).map(a => {
                      const teacher = teacherById.get(a.teacher_id);
                      return (
                        <div key={a.id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                          <p className="font-semibold">{teacher?.full_name || "Teacher record unavailable"}</p>
                          <p className="mt-1 text-xs text-slate-400">{teacher?.subject_specialisation || "Subject not listed"} {teacher?.email ? `• ${teacher.email}` : ""}</p>
                          <p className="mt-1 text-xs text-slate-500">Assigned: {formatDate(a.assigned_at)}</p>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-teal-800 bg-slate-900 p-5 shadow-xl sm:p-7">
          <h2 className="text-2xl font-bold">Create a new live tutorial</h2>
          <p className="mt-2 text-sm text-slate-400">Set the lesson details, schedule and payment instructions before publishing.</p>

          <form action={createLiveTutorial} className="mt-7 space-y-5">
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-semibold">Tutorial title</label>
              <input id="title" name="title" required minLength={3} maxLength={180} placeholder="Example: MICAN Mathematics Masterclass" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-semibold">Subject</label>
                <input id="subject" name="subject" required minLength={2} maxLength={120} placeholder="Mathematics" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white" />
              </div>
              <div>
                <label htmlFor="topic" className="mb-2 block text-sm font-semibold">Topic</label>
                <input id="topic" name="topic" required minLength={2} maxLength={180} placeholder="Quadratic equations" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white" />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-semibold">Tutorial description</label>
              <textarea id="description" name="description" rows={4} maxLength={5000} placeholder="Explain what students will learn..." className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="scheduledStart" className="mb-2 block text-sm font-semibold">Starting date and time</label>
                <input id="scheduledStart" type="datetime-local" name="scheduledStart" required className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white" />
              </div>
              <div>
                <label htmlFor="scheduledEnd" className="mb-2 block text-sm font-semibold">Ending date and time</label>
                <input id="scheduledEnd" type="datetime-local" name="scheduledEnd" required className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white" />
              </div>
            </div>
            <p className="text-xs text-slate-500">Scheduling uses West Africa Time (WAT).</p>

            <div className="rounded-2xl border border-teal-800 bg-teal-950/30 p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-300">Tutorial payment settings</p>
              <h3 className="mt-2 text-xl font-bold">Set the access price</h3>
              <p className="mt-2 text-sm text-slate-400">Choose whether schools must pay for this tutorial. You can exempt individual schools from payment separately.</p>

              <div className="mt-5">
                <label htmlFor="paymentRequired" className="mb-2 block text-sm font-semibold">Payment requirement</label>
                <select id="paymentRequired" name="paymentRequired" defaultValue="true" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white">
                  <option value="true">Payment required for schools</option>
                  <option value="false">Free tutorial — no payment required</option>
                </select>
              </div>

              <div className="mt-5">
                <label htmlFor="priceAmount" className="mb-2 block text-sm font-semibold">Tutorial amount (₦)</label>
                <input id="priceAmount" name="priceAmount" type="number" min="1" step="0.01" placeholder="Example: 5000" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white" />
              </div>

              <div className="mt-5">
                <label htmlFor="paymentMethod" className="mb-2 block text-sm font-semibold">Payment method</label>
                <select id="paymentMethod" name="paymentMethod" defaultValue="bank_transfer" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white">
                  <option value="bank_transfer">Bank transfer</option>
                </select>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="bankName" className="mb-2 block text-sm font-semibold">Bank name</label>
                  <input id="bankName" name="bankName" maxLength={100} placeholder="Your bank name" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white" />
                </div>
                <div>
                  <label htmlFor="accountName" className="mb-2 block text-sm font-semibold">Account name</label>
                  <input id="accountName" name="accountName" maxLength={120} placeholder="Name on the account" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white" />
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="accountNumber" className="mb-2 block text-sm font-semibold">Account number</label>
                <input id="accountNumber" name="accountNumber" inputMode="numeric" maxLength={10} placeholder="10-digit account number" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white" />
              </div>

              <div className="mt-5">
                <label htmlFor="paymentInstructions" className="mb-2 block text-sm font-semibold">Additional payment instructions (optional)</label>
                <textarea id="paymentInstructions" name="paymentInstructions" rows={3} maxLength={2000} placeholder="Tell schools what reference or description to include when making payment." className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white" />
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-400">Only the bank transfer details entered here will be displayed as payment instructions for this tutorial. Payment must still be verified by you before access is granted.</p>
            </div>

            <div>
              <label htmlFor="status" className="mb-2 block text-sm font-semibold">Tutorial status</label>
              <select id="status" name="status" defaultValue="draft" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white">
                <option value="draft">Save as draft</option>
                <option value="published">Publish tutorial</option>
              </select>
            </div>

            <button type="submit" className="w-full rounded-xl bg-white px-6 py-4 text-sm font-black text-slate-950 hover:bg-teal-100">Create Tutorial</button>
          </form>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Tutorial records</p>
            <h2 className="mt-2 text-2xl font-bold">Scheduled tutorials</h2>
            <p className="mt-2 text-sm text-slate-400">Review tutorials, their schedules, payment settings and assigned teachers.</p>
          </div>

          {allTutorials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center">
              <p className="text-4xl">🎥</p>
              <h3 className="mt-3 font-bold">No tutorials created yet</h3>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {allTutorials.map(t => (
                <article key={t.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-teal-400">{t.subject}</p>
                      <h3 className="mt-2 text-lg font-bold">{t.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{t.topic}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(t.status)}`}>{t.status.toUpperCase()}</span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-400">{t.description || "No description provided."}</p>

                  <div className="mt-5 grid gap-4 border-t border-slate-800 pt-4 text-sm sm:grid-cols-2">
                    <div><p className="text-xs text-slate-500">Starts</p><p className="mt-1">{formatDate(t.scheduled_start)}</p></div>
                    <div><p className="text-xs text-slate-500">Ends</p><p className="mt-1">{formatDate(t.scheduled_end)}</p></div>
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-300">Payment settings</p>
                    {t.payment_required ? (
                      <div className="mt-3 space-y-2 text-sm">
                        <p className="text-xl font-black text-white">₦{Number(t.price_amount || 0).toLocaleString("en-NG")}</p>
                        <p className="text-slate-300">Method: Bank transfer</p>
                        <p className="text-slate-300">Bank: {t.bank_name || "Not set"}</p>
                        <p className="text-slate-300">Account name: {t.account_name || "Not set"}</p>
                        <p className="text-slate-300">Account number: {t.account_number || "Not set"}</p>
                        {t.payment_instructions && <p className="whitespace-pre-wrap text-slate-400">{t.payment_instructions}</p>}
                      </div>
                    ) : (
                      <p className="mt-2 font-semibold text-emerald-300">Free tutorial — payment not required</p>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-800 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned teachers</p>
                    {assignmentsByTutorial.has(t.id) ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(assignmentsByTutorial.get(t.id) || []).map(a => (
                          <span key={a.id} className="rounded-lg border border-teal-900 bg-teal-950/50 px-3 py-2 text-xs font-semibold text-teal-200">
                            {teacherById.get(a.teacher_id)?.full_name || "Teacher unavailable"}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">No teacher assigned yet.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-slate-800 py-7 text-center">
          <p className="text-xs font-bold tracking-widest text-slate-400">MICAN TECHNOLOGIES</p>
          <p className="mt-2 text-xs text-slate-600">One Network. Many Schools. One Connected Future.</p>
        </footer>
      </div>
    </main>
  );
}
