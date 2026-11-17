
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function SchoolDashboardPage() {
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
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin"]);

  if (membershipError) {
    return (
      <main className="school-dashboard-page">
        <section className="dashboard-card">
          <h1>Unable to load your dashboard</h1>
          <p>Please try again later.</p>
        </section>
      </main>
    );
  }

  const schoolIds = [
    ...new Set((memberships || []).map((item) => item.school_id)),
  ];

  if (schoolIds.length === 0) {
    redirect("/school-access");
  }

  const { data: schools, error: schoolError } = await admin
    .from("schools")
    .select(
      "id, school_name, school_type, country, state, city, contact_email, contact_phone, status"
    )
    .in("id", schoolIds)
    .eq("status", "approved");

  if (schoolError) {
    return (
      <main className="school-dashboard-page">
        <section className="dashboard-card">
          <h1>Unable to load school information</h1>
          <p>Please try again later.</p>
        </section>
      </main>
    );
  }

  if (!schools || schools.length === 0) {
    redirect("/school-access");
  }

  return (
    <main className="school-dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-brand">MICAN SCHOOLS CONNECT</p>
            <span className="dashboard-label">SCHOOL MANAGEMENT</span>
          </div>

          <form action="/auth/sign-out" method="post">
            <button className="dashboard-signout" type="submit">
              Sign out
            </button>
          </form>
        </header>

        <section className="dashboard-welcome">
          <p className="dashboard-kicker">SCHOOL WORKSPACE</p>
          <h1>Welcome to your dashboard</h1>
          <p>
            Manage your school activities from one organised workspace.
          </p>
        </section>

        {schools.map((school) => {
          const membership = memberships.find(
            (item) => item.school_id === school.id
          );

          return (
            <section className="dashboard-school" key={school.id}>
              <div className="dashboard-school-heading">
                <div>
                  <p className="dashboard-kicker">YOUR SCHOOL</p>
                  <h2>{school.school_name}</h2>
                  <p>
                    {school.city}, {school.state}, {school.country}
                  </p>
                </div>

                <span className="dashboard-approved">Approved</span>
              </div>

              <div className="dashboard-details">
                <div>
                  <span>School type</span>
                  <strong>{school.school_type}</strong>
                </div>

                <div>
                  <span>Your role</span>
                  <strong>{membership?.role || "School member"}</strong>
                </div>

                <div>
                  <span>Contact email</span>
                  <strong>{school.contact_email}</strong>
                </div>

                <div>
                  <span>Contact phone</span>
                  <strong>{school.contact_phone}</strong>
                </div>
              </div>
            </section>
          );
        })}

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-kicker">SCHOOL OVERVIEW</p>
              <h2>Your school at a glance</h2>
            </div>
            <span className="dashboard-coming">
              MORE FEATURES COMING
            </span>
          </div>

          <div className="dashboard-stats">
            <article className="dashboard-stat">
              <span className="stat-icon">🎓</span>
              <p>Students</p>
              <strong>Management available</strong>
              <small>Open Student Management below.</small>
            </article>

            <article className="dashboard-stat">
              <span className="stat-icon">👩‍🏫</span>
              <p>Teachers</p>
              <strong>Management available</strong>
              <small>Open Teacher Management below.</small>
            </article>

            <article className="dashboard-stat">
              <span className="stat-icon">🏫</span>
              <p>Classes</p>
              <strong>Management available</strong>
              <small>Open Class Management below.</small>
            </article>
          </div>
        </section>

        {schools.map((school) => (
          <section className="dashboard-section" key={school.id}>
            <p className="dashboard-kicker">MANAGEMENT CENTRE</p>
            <h2>{school.school_name}</h2>

            <div className="dashboard-modules">
              <Link
                href={`/school-dashboard/students/${school.id}`}
                className="dashboard-module"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <span>🎓</span>
                <h3>Student Management</h3>
                <p>
                  Register students, assign classes and manage student records.
                </p>
                <small>Open student management →</small>
              </Link>

              <Link
                href={`/school-dashboard/classes/${school.id}`}
                className="dashboard-module"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <span>📚</span>
                <h3>Class Management</h3>
                <p>
                  Create classes, manage class arms and academic years.
                </p>
                <small>Open class management →</small>
              </Link>

              <Link
                href={`/school-dashboard/teachers/${school.id}`}
                className="dashboard-module"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <span>👩‍🏫</span>
                <h3>Teacher Management</h3>
                <p>
                  Register teachers, edit staff records and manage employment
                  status.
                </p>
                <small>Open teacher management →</small>
              </Link>

              <Link
                href={`/school-dashboard/attendance/${school.id}`}
                className="dashboard-module"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <span>📅</span>
                <h3>Attendance Management</h3>
                <p>
                  Record daily student attendance and review previous records.
                </p>
                <small>Open attendance management →</small>
              </Link>

              <Link
                href={`/school-dashboard/announcements/${school.id}`}
                className="dashboard-module"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <span>📢</span>
                <h3>Announcements Management</h3>
                <p>
                  Create, edit and manage important school notices and updates.
                </p>
                <small>Open announcements management →</small>
              </Link>

              <Link
                href={`/school-dashboard/live-learning/${school.id}`}
                className="dashboard-module dashboard-live-module"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <span>🎥</span>
                <h3>MICAN LIVE LEARNING</h3>
                <p>
                  Browse live tutorials, view payment instructions and request
                  access for your school.
                </p>
                <small>Open MICAN LIVE LEARNING →</small>
              </Link>
            </div>
          </section>
        ))}

        <footer className="dashboard-footer">
          One Network. Many Schools. One Connected Future.
          <br />
          © MICAN Technologies
        </footer>
      </div>
    </main>
  );
}
