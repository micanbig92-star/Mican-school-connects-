
import { redirect } from "next/navigation";
import { getPlatformAdmin } from "@/lib/supabase/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateSchoolStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function PlatformAdminPage() {
  const user = await getPlatformAdmin();

  if (!user) redirect("/school-access");

  const admin = createAdminClient();

  const { data: schools, error } = await admin
    .from("schools")
    .select(
      "id, school_name, school_type, country, state, city, contact_email, contact_phone, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <h1 className="text-2xl font-bold">Unable to load schools</h1>
        <p className="mt-2 text-slate-400">
          Please refresh and try again.
        </p>
      </main>
    );
  }

  const allSchools = schools || [];
  const pending = allSchools.filter(s => s.status === "pending_review").length;
  const approved = allSchools.filter(s => s.status === "approved").length;
  const suspended = allSchools.filter(s => s.status === "suspended").length;
  const rejected = allSchools.filter(s => s.status === "rejected").length;

  function statusStyle(status: string) {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending_review":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "suspended":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "rejected":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  }

  function displayStatus(status: string) {
    if (status === "pending_review") return "Pending review";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  const stats = [
    {
      label: "Total schools",
      value: allSchools.length,
      note: "All registered schools",
      icon: "🏫",
      color: "border-l-blue-500",
    },
    {
      label: "Pending applications",
      value: pending,
      note: "Awaiting your review",
      icon: "⏳",
      color: "border-l-amber-500",
    },
    {
      label: "Approved schools",
      value: approved,
      note: "Active school approvals",
      icon: "✓",
      color: "border-l-emerald-500",
    },
    {
      label: "Suspended schools",
      value: suspended,
      note: "Currently suspended",
      icon: "⊘",
      color: "border-l-rose-500",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen flex-col md:flex-row">

        <aside className="w-full bg-[#101d35] text-white md:fixed md:inset-y-0 md:w-64">
          <div className="border-b border-white/10 px-6 py-7">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-500 text-xl font-black">
                M
              </div>
              <div>
                <p className="font-bold tracking-widest">MICAN</p>
                <p className="text-[10px] tracking-[2px] text-teal-300">
                  TECHNOLOGIES
                </p>
              </div>
            </div>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[2px] text-slate-400">
              Platform control
            </p>
          </div>

          <nav className="space-y-2 p-4 text-sm">
            <a href="#overview" className="flex items-center gap-3 rounded-xl bg-teal-500/15 px-4 py-3 font-semibold text-teal-300">
              <span>▦</span> Overview
            </a>
            <a href="#schools" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 hover:bg-white/10">
              <span>🏫</span> All schools
            </a>
            <a href="#applications" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 hover:bg-white/10">
              <span>📋</span> Applications
              {pending > 0 && (
                <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-900">
                  {pending}
                </span>
              )}
            </a>
            <a href="#platform-summary" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 hover:bg-white/10">
              <span>📊</span> Platform summary
            </a>
          </nav>

          <div className="border-t border-white/10 p-4 md:absolute md:bottom-0 md:left-0 md:right-0">
            <div className="mb-4 rounded-xl bg-white/5 p-3">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="mt-1 break-all text-sm font-semibold">
                {user.email}
              </p>
              <p className="mt-1 text-xs text-teal-300">Super Administrator</p>
            </div>
            <form action="/auth/sign-out" method="post">
              <button className="w-full rounded-xl border border-white/15 px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/10">
                ↪ Sign out
              </button>
            </form>
          </div>
        </aside>

        <section className="min-w-0 flex-1 md:ml-64">
          <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:px-9">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
                MICAN SCHOOLS CONNECT
              </p>
              <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
                Platform dashboard
              </h1>
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              ● Secure admin session
            </div>
          </header>

          <div className="space-y-8 p-5 md:p-9">

            <section id="overview" className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#142b4b] to-[#176b70] p-6 text-white shadow-lg md:p-9">
              <p className="text-xs font-bold uppercase tracking-[3px] text-teal-200">
                Welcome to your control centre
              </p>
              <h2 className="mt-3 text-2xl font-bold md:text-4xl">
                One Network. Many Schools.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200">
                Monitor school registrations and manage the growing MICAN
                education network from one secure platform.
              </p>
              <a href="#schools" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#142b4b] hover:bg-teal-50">
                View registered schools →
              </a>
            </section>

            <section id="platform-summary">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
                    Network overview
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Platform statistics
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Live database figures
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map(item => (
                  <article key={item.label} className={`rounded-2xl border border-slate-200 border-l-4 ${item.color} bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-500">
                        {item.label}
                      </p>
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-lg">
                        {item.icon}
                      </span>
                    </div>
                    <p className="mt-4 text-3xl font-black text-slate-900">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                  </article>
                ))}
              </div>
            </section>

            <section id="applications" className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-semibold text-amber-800">
                  Applications awaiting review
                </p>
                <p className="mt-2 text-3xl font-black text-amber-900">
                  {pending}
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  These schools need an approval decision.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-600">
                  Rejected applications
                </p>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {rejected}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Applications not approved.
                </p>
              </div>
            </section>

            <section id="schools">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
                    School directory
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Registered schools
                  </h2>
                </div>
                <span className="rounded-full bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
                  {allSchools.length} total
                </span>
              </div>

              {allSchools.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <div className="text-4xl">🏫</div>
                  <h3 className="mt-3 font-bold text-slate-800">
                    No schools registered yet
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    New school applications will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {allSchools.map(school => (
                    <article key={school.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 text-xl">
                            🏫
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">
                              {school.school_name}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {school.school_type}
                            </p>
                          </div>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(school.status)}`}>
                          {displayStatus(school.status)}
                        </span>
                      </div>

                      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
                        <p className="text-slate-600">
                          📍 {school.city}, {school.state}, {school.country}
                        </p>
                        <p className="break-all text-slate-600">
                          ✉ {school.contact_email}
                        </p>
                        <p className="text-slate-600">
                          ☎ {school.contact_phone}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-xs text-slate-400">
                          Registered {new Date(school.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs font-semibold text-teal-700">
                          MICAN Network
                        </span>
                      </div>

                      {/* School management actions */}
                      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {school.status === "pending_review" && (
                          <>
                            <form action={updateSchoolStatus}>
                              <input type="hidden" name="schoolId" value={school.id} />
                              <input type="hidden" name="status" value="approved" />
                              <button
                                type="submit"
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                              >
                                Approve school
                              </button>
                            </form>

                            <form action={updateSchoolStatus}>
                              <input type="hidden" name="schoolId" value={school.id} />
                              <input type="hidden" name="status" value="rejected" />
                              <button
                                type="submit"
                                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                              >
                                Reject application
                              </button>
                            </form>
                          </>
                        )}

                        {school.status === "approved" && (
                          <form action={updateSchoolStatus}>
                            <input type="hidden" name="schoolId" value={school.id} />
                            <input type="hidden" name="status" value="suspended" />
                            <button
                              type="submit"
                              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                            >
                              Suspend school
                            </button>
                          </form>
                        )}

                        {school.status === "suspended" && (
                          <form action={updateSchoolStatus}>
                            <input type="hidden" name="schoolId" value={school.id} />
                            <input type="hidden" name="status" value="approved" />
                            <button
                              type="submit"
                              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                              Reactivate school
                            </button>
                          </form>
                        )}

                        {school.status === "rejected" && (
                          <p className="text-xs text-slate-500">
                            This application has been rejected.
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <footer className="border-t border-slate-200 py-6 text-center">
              <p className="text-xs font-bold tracking-widest text-slate-600">
                MICAN TECHNOLOGIES
              </p>
              <p className="mt-2 text-xs text-slate-500">
                One Network. Many Schools. One Connected Future.
              </p>
              <p className="mt-2 text-[10px] text-slate-400">
                Private platform administration
              </p>
            </footer>

          </div>
        </section>
      </div>
    </main>
  );
}
