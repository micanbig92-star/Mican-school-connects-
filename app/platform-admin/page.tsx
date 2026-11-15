
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPlatformAdmin } from "@/lib/supabase/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function PlatformAdminPage() {
  const user = await getPlatformAdmin();

  if (!user) {
    redirect("/school-access");
  }

  const admin = createAdminClient();

  const { data: schools, error } = await admin
    .from("schools")
    .select(
      "id, school_name, school_type, country, state, city, contact_email, contact_phone, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6">
        <h1 className="text-2xl font-bold">
          Unable to load schools
        </h1>
        <p className="mt-3 text-slate-400">
          Please refresh and try again later.
        </p>
      </main>
    );
  }

  const allSchools = schools || [];
  const pending = allSchools.filter(
    (school) => school.status === "pending_review"
  ).length;
  const approved = allSchools.filter(
    (school) => school.status === "approved"
  ).length;
  const suspended = allSchools.filter(
    (school) => school.status === "suspended"
  ).length;

  function displayStatus(status: string) {
    if (status === "pending_review") return "Pending review";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-widest text-cyan-400">
              MICAN TECHNOLOGIES
            </p>
            <h1 className="mt-3 text-3xl font-bold">
              Super Admin Dashboard
            </h1>
            <p className="mt-2 text-slate-400">
              Manage schools across the MICAN network.
            </p>
          </div>

          <form action="/auth/sign-out" method="post">
            <button className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
              Sign out
            </button>
          </form>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total schools", value: allSchools.length },
            { label: "Pending applications", value: pending },
            { label: "Approved schools", value: approved },
            { label: "Suspended schools", value: suspended },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-bold">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              Registered schools
            </h2>
            <span className="text-sm text-slate-400">
              {allSchools.length} school(s)
            </span>
          </div>

          {allSchools.length === 0 ? (
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-8">
              <p className="text-slate-300">
                No school applications have been submitted yet.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {allSchools.map((school) => (
                <article
                  key={school.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">
                        {school.school_name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {school.school_type} · {school.city},{" "}
                        {school.state}, {school.country}
                      </p>
                    </div>

                    <span className="rounded-full border border-slate-700 px-3 py-1 text-sm">
                      {displayStatus(school.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    <p>
                      <span className="text-slate-500">Email: </span>
                      {school.contact_email}
                    </p>
                    <p>
                      <span className="text-slate-500">Phone: </span>
                      {school.contact_phone}
                    </p>
                    <p>
                      <span className="text-slate-500">Registered: </span>
                      {new Date(school.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-slate-800 pt-5 text-xs text-slate-500">
          Private platform administration · MICAN SCHOOLS CONNECT
          <p className="mt-2">
            One Network. Many Schools. One Connected Future.
          </p>
        </footer>
      </div>
    </main>
  );
}
