
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SchoolAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const admin = createAdminClient();

  const { data: memberships, error: membershipError } = await admin
    .from("school_memberships")
    .select("school_id, role, status")
    .eq("user_id", user.id);

  if (membershipError) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="text-2xl font-bold">Unable to check access</h1>
          <p className="mt-3 text-slate-400">
            We could not check your school application. Please try again later.
          </p>
        </div>
      </main>
    );
  }

  const schoolIds = [
    ...new Set((memberships || []).map((membership) => membership.school_id)),
  ];

  let schools: Array<{
    id: string;
    school_name: string;
    status: string;
  }> = [];

  if (schoolIds.length > 0) {
    const { data, error } = await admin
      .from("schools")
      .select("id, school_name, status")
      .in("id", schoolIds);

    if (error) {
      return (
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h1 className="text-2xl font-bold">Unable to load school</h1>
            <p className="mt-3 text-slate-400">
              Please try again later.
            </p>
          </div>
        </main>
      );
    }

    schools = data || [];
  }

  const applications = (memberships || []).map((membership) => {
    const school = schools.find(
      (item) => item.id === membership.school_id
    );

    return { membership, school };
  });

  const hasApprovedAccess = applications.some(
    ({ membership, school }) =>
      membership.status === "active" &&
      school?.status === "approved"
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white px-5 py-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-bold tracking-widest text-cyan-400">
          MICAN TECHNOLOGIES
        </p>

        <h1 className="mt-4 text-3xl font-bold">
          Your school access
        </h1>

        <p className="mt-2 text-slate-400">
          Your account is signed in. Here is the status of your school access.
        </p>

        {applications.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              No school application found
            </h2>
            <p className="mt-3 text-slate-400">
              We could not find a school application connected to this account.
            </p>
            <Link
              href="/register-school"
              className="mt-5 inline-block text-cyan-400 hover:underline"
            >
              Register a school
            </Link>
          </section>
        ) : (
          <div className="mt-8 space-y-5">
            {applications.map(({ membership, school }, index) => (
              <section
                key={`${membership.school_id}-${index}`}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <h2 className="text-xl font-semibold">
                  {school?.school_name || "School application"}
                </h2>

                <p className="mt-3 text-sm text-slate-400">
                  Application status:{" "}
                  <span className="font-semibold text-white">
                    {school?.status || "Unavailable"}
                  </span>
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Membership status:{" "}
                  <span className="font-semibold text-white">
                    {membership.status}
                  </span>
                </p>

                {school?.status === "approved" &&
                membership.status === "active" ? (
                  <p className="mt-4 text-green-400">
                    Your school access has been approved.
                  </p>
                ) : school?.status === "rejected" ? (
                  <p className="mt-4 text-red-400">
                    This school application was not approved.
                  </p>
                ) : school?.status === "suspended" ||
                  membership.status === "suspended" ? (
                  <p className="mt-4 text-yellow-400">
                    School access is currently suspended.
                  </p>
                ) : (
                  <p className="mt-4 text-yellow-400">
                    Your application is awaiting review. Please check again later.
                  </p>
                )}
              </section>
            ))}
          </div>
        )}

        {hasApprovedAccess && (
          <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-slate-300">
              Your school is approved. The school workspace dashboard is still
              under development and will be made available when ready.
            </p>
          </section>
        )}

        <form action="/auth/sign-out" method="post" className="mt-8">
          <button
            type="submit"
            className="rounded-lg border border-slate-700 px-5 py-3 text-white hover:bg-slate-800"
          >
            Sign out
          </button>
        </form>

        <p className="mt-8 text-xs text-slate-500">
          One Network. Many Schools. One Connected Future.
        </p>
      </div>
    </main>
  );
}
