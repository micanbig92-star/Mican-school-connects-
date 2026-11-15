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
      <main className="school-access-page">
        <div className="access-card">
          <h1 className="text-2xl font-bold">
            Unable to check access
          </h1>
          <p className="mt-3 text-slate-500">
            We could not check your school application. Please try again later.
          </p>
        </div>
      </main>
    );
  }

  const schoolIds = [
    ...new Set(
      (memberships || []).map((membership) => membership.school_id)
    ),
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
        <main className="school-access-page">
          <div className="access-card">
            <h1 className="text-2xl font-bold">
              Unable to load school
            </h1>
            <p className="mt-3 text-slate-500">
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

  // Only approved school owners and administrators can see this link.
  const hasApprovedManagerAccess = applications.some(
    ({ membership, school }) =>
      membership.status === "active" &&
      ["owner", "admin"].includes(membership.role) &&
      school?.status === "approved"
  );

  return (
    <main className="school-access-page">
      <div className="access-container">
        <header className="access-header">
          <p className="access-brand">
            MICAN TECHNOLOGIES
          </p>

          <span className="access-label">
            SCHOOL PORTAL
          </span>
        </header>

        <section className="access-intro">
          <p className="access-kicker">
            WELCOME TO YOUR SCHOOL PORTAL
          </p>

          <h1>Your school access</h1>

          <p>
            Your account is signed in. Here is the status of your school access.
          </p>
        </section>

        {applications.length === 0 ? (
          <section className="access-card">
            <h2 className="text-xl font-semibold">
              No school application found
            </h2>

            <p className="mt-3 text-slate-500">
              We could not find a school application connected to this account.
            </p>

            <Link
              href="/register-school"
              className="access-link"
            >
              Register a school
            </Link>
          </section>
        ) : (
          <div className="access-applications">
            {applications.map(({ membership, school }, index) => {
              const status = school?.status || "unavailable";

              const statusClass =
                status === "approved"
                  ? "status-approved"
                  : status === "rejected"
                    ? "status-rejected"
                    : status === "suspended"
                      ? "status-suspended"
                      : "status-pending";

              return (
                <section
                  key={`${membership.school_id}-${index}`}
                  className="access-card"
                >
                  <div className="access-school-heading">
                    <div>
                      <p className="access-kicker">
                        SCHOOL APPLICATION
                      </p>

                      <h2>
                        {school?.school_name || "School application"}
                      </h2>
                    </div>

                    <span className={`access-status ${statusClass}`}>
                      {status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="access-details">
                    <div>
                      <span>Application status</span>
                      <strong>
                        {school?.status || "Unavailable"}
                      </strong>
                    </div>

                    <div>
                      <span>Membership status</span>
                      <strong>{membership.status}</strong>
                    </div>

                    <div>
                      <span>Your role</span>
                      <strong>{membership.role}</strong>
                    </div>
                  </div>

                  {school?.status === "approved" &&
                  membership.status === "active" ? (
                    <p className="access-message message-approved">
                      Your school access has been approved.
                    </p>
                  ) : school?.status === "rejected" ? (
                    <p className="access-message message-rejected">
                      This school application was not approved.
                    </p>
                  ) : school?.status === "suspended" ||
                    membership.status === "suspended" ? (
                    <p className="access-message message-suspended">
                      School access is currently suspended.
                    </p>
                  ) : (
                    <p className="access-message message-pending">
                      Your application is awaiting review. Please check again
                      later.
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {hasApprovedAccess && (
          <section className="access-notice">
            <h2>School access confirmed</h2>

            <p>
              Your school is approved. Your available school services are shown
              below.
            </p>

            {hasApprovedManagerAccess && (
              <Link
                href="/school-dashboard"
                className="access-link"
              >
                Open School Dashboard
              </Link>
            )}
          </section>
        )}

        <form
          action="/auth/sign-out"
          method="post"
          className="access-signout"
        >
          <button type="submit">
            Sign out
          </button>
        </form>

        <footer className="access-footer">
          One Network. Many Schools. One Connected Future.
        </footer>
      </div>
    </main>
  );
}