import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolManager } from "@/lib/supabase/school-manager";
import { createClass, deleteClass } from "../../actions";

type Props = {
  params: Promise<{ schoolId: string }>;
};

export default async function ClassesPage({ params }: Props) {
  const { schoolId } = await params;
  const { admin, school } = await requireSchoolManager(schoolId);

  const { data: classes, error } = await admin
    .from("school_classes")
    .select("id, class_name, arm, academic_year, created_at")
    .eq("school_id", schoolId)
    .order("class_name", { ascending: true });

  if (error) notFound();

  return (
    <main className="school-dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-brand">MICAN SCHOOLS CONNECT</p>
            <span className="dashboard-label">CLASS MANAGEMENT</span>
          </div>
          <Link href="/school-dashboard">Back to dashboard</Link>
        </header>

        <section className="dashboard-welcome">
          <p className="dashboard-kicker">SCHOOL WORKSPACE</p>
          <h1>Class Management</h1>
          <p>{school.school_name}</p>
        </section>

        <section className="dashboard-section">
          <h2>Create a new class</h2>
          <p>Register a class and its arm for an academic year.</p>

          <form action={createClass} className="signin-card">
            <input type="hidden" name="schoolId" value={schoolId} />

            <label>Class name</label>
            <input
              className="signin-input"
              name="className"
              placeholder="Example: JSS 1"
              required
              maxLength={80}
            />

            <label>Class arm</label>
            <input
              className="signin-input"
              name="arm"
              placeholder="Example: A"
              defaultValue="A"
              maxLength={30}
            />

            <label>Academic year</label>
            <input
              className="signin-input"
              name="academicYear"
              placeholder="Example: 2026/2027"
              required
              minLength={4}
              maxLength={20}
            />

            <button className="signin-button" type="submit">
              Create class
            </button>
          </form>
        </section>

        <section className="dashboard-section">
          <h2>Registered classes</h2>
          <p>{classes?.length || 0} classes registered</p>

          {!classes?.length ? (
            <p>No classes have been created yet.</p>
          ) : (
            <div className="dashboard-modules">
              {classes.map((item) => (
                <article className="dashboard-module" key={item.id}>
                  <h3>{item.class_name} — {item.arm}</h3>
                  <p>Academic year: {item.academic_year}</p>

                  <form action={deleteClass}>
                    <input
                      type="hidden"
                      name="schoolId"
                      value={schoolId}
                    />
                    <input
                      type="hidden"
                      name="classId"
                      value={item.id}
                    />
                    <button className="dashboard-signout" type="submit">
                      Delete class
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}