
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPlatformAdmin } from "@/lib/supabase/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  approveLiveTeacher,
  rejectLiveTeacher,
} from "./actions";

export const dynamic = "force-dynamic";

type TeacherApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject_specialisation: string | null;
  status: string;
  created_at: string;
  approved_at: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });
}

function statusStyle(status: string) {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "rejected" || status === "suspended") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-amber-100 text-amber-800";
}

export default async function LiveTeacherApplicationsPage() {
  const user = await getPlatformAdmin();

  if (!user) {
    redirect("/school-access");
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("platform_live_teachers")
    .select(
      "id, full_name, email, phone, subject_specialisation, status, created_at, approved_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Teacher applications loading failed:", error.message);

    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Unable to load teacher applications
        </h1>
        <p className="mt-3 text-slate-600">
          Please refresh the page and try again.
        </p>
        <Link
          href="/platform-admin/live-learning"
          className="mt-5 inline-block text-teal-700 underline"
        >
          Return to Live Learning
        </Link>
      </main>
    );
  }

  const teachers = (data || []) as TeacherApplication[];

  const pending = teachers.filter(
    (teacher) => teacher.status === "pending"
  );

  const approved = teachers.filter(
    (teacher) => teacher.status === "approved"
  );

  const rejected = teachers.filter(
    (teacher) => teacher.status === "rejected"
  );

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-8 p-5 md:p-9">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
              MICAN TECHNOLOGIES
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
              Teacher Applications
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Review and manage MICAN Live Learning teacher applications.
            </p>
          </div>

          <Link
            href="/platform-admin/live-learning"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
          >
            ← Back to Live Learning
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total applications</p>
            <p className="mt-2 text-3xl font-black">{teachers.length}</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pending review</p>
            <p className="mt-2 text-3xl font-black text-amber-600">
              {pending.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Approved teachers</p>
            <p className="mt-2 text-3xl font-black text-emerald-600">
              {approved.length}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Rejected applications</p>
            <p className="mt-2 text-3xl font-black text-rose-600">
              {rejected.length}
            </p>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
              Review queue
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Pending applications ({pending.length})
            </h2>
          </div>

          {pending.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-3xl">📋</p>
              <h3 className="mt-3 font-bold">
                No pending applications
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                New teacher applications will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {pending.map((teacher) => (
                <article
                  key={teacher.id}
                  className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {teacher.full_name}
                      </h3>
                      <p className="mt-1 text-sm text-teal-700">
                        {teacher.subject_specialisation || "Subject not specified"}
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                      PENDING
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
                    <p>
                      <strong>Email:</strong>{" "}
                      <a
                        href={`mailto:${teacher.email}`}
                        className="break-all text-teal-700 underline"
                      >
                        {teacher.email}
                      </a>
                    </p>

                    <p>
                      <strong>Phone:</strong>{" "}
                      {teacher.phone ? (
                        <a
                          href={`tel:${teacher.phone}`}
                          className="text-teal-700 underline"
                        >
                          {teacher.phone}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </p>

                    <p>
                      <strong>Applied:</strong>{" "}
                      {formatDate(teacher.created_at)}
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <form action={approveLiveTeacher}>
                      <input
                        type="hidden"
                        name="teacherId"
                        value={teacher.id}
                      />
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
                      >
                        Approve
                      </button>
                    </form>

                    <form action={rejectLiveTeacher}>
                      <input
                        type="hidden"
                        name="teacherId"
                        value={teacher.id}
                      />
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white hover:bg-rose-800"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Approved accounts
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Approved teachers ({approved.length})
            </h2>
          </div>

          {approved.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-sm text-slate-500">
              No teachers have been approved yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approved.map((teacher) => (
                <article
                  key={teacher.id}
                  className="rounded-2xl border border-emerald-200 bg-white p-5"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-bold text-slate-900">
                      {teacher.full_name}
                    </h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(teacher.status)}`}>
                      APPROVED
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    {teacher.subject_specialisation || "Subject not specified"}
                  </p>

                  <p className="mt-3 break-all text-sm">
                    <strong>Email:</strong> {teacher.email}
                  </p>

                  <p className="mt-2 text-sm">
                    <strong>Phone:</strong> {teacher.phone || "Not provided"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <a
                      href={`mailto:${teacher.email}`}
                      className="font-semibold text-teal-700 underline"
                    >
                      Contact by email
                    </a>

                    {teacher.phone && (
                      <a
                        href={`tel:${teacher.phone}`}
                        className="font-semibold text-teal-700 underline"
                      >
                        Call teacher
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">
            Rejected applications ({rejected.length})
          </h2>

          {rejected.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-sm text-slate-500">
              No rejected applications.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rejected.map((teacher) => (
                <article
                  key={teacher.id}
                  className="rounded-2xl border border-rose-200 bg-white p-5"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-bold text-slate-900">
                      {teacher.full_name}
                    </h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(teacher.status)}`}>
                      REJECTED
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {teacher.subject_specialisation || "Subject not specified"}
                  </p>
                  <p className="mt-2 break-all text-sm">{teacher.email}</p>
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
