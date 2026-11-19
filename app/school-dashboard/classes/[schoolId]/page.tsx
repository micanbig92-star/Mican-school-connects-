
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolManager } from "@/lib/supabase/school-manager";
import {
  createClass,
  archiveClass,
  restoreClass,
  deleteClass,
} from "../../actions";

type Props = {
  params: Promise<{ schoolId: string }>;
};

export default async function ClassesPage({ params }: Props) {
  const { schoolId } = await params;
  const { admin, school } = await requireSchoolManager(schoolId);

  const [
    { data: classes, error: classesError },
    { data: students, error: studentsError },
  ] = await Promise.all([
    admin
      .from("school_classes")
      .select("id, class_name, arm, academic_year, created_at, archived_at, deleted_at")
      .eq("school_id", schoolId)
      .order("class_name", { ascending: true }),
    admin
      .from("students")
      .select("id, class_id")
      .eq("school_id", schoolId)
      .is("deleted_at", null),
  ]);

  if (classesError || studentsError || !classes || !students) notFound();

  const activeClasses = classes.filter(
    (item) => !item.archived_at && !item.deleted_at
  );

  const archivedClasses = classes.filter(
    (item) => item.archived_at && !item.deleted_at
  );

  const trashedClasses = classes.filter(
    (item) => Boolean(item.deleted_at)
  );

  const studentCount = (classId: string) =>
    students.filter((student) => student.class_id === classId).length;

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
          <h2>Class records overview</h2>
          <div className="dashboard-modules">
            <article className="dashboard-module">
              <h3>Active classes</h3>
              <p>{activeClasses.length}</p>
            </article>
            <article className="dashboard-module">
              <h3>Archived classes</h3>
              <p>{archivedClasses.length}</p>
            </article>
            <article className="dashboard-module">
              <h3>Classes in Trash</h3>
              <p>{trashedClasses.length}</p>
            </article>
          </div>
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
          <h2>Active classes</h2>
          <p>{activeClasses.length} active classes</p>

          {activeClasses.length === 0 ? (
            <p>No active classes have been created yet.</p>
          ) : (
            <div className="dashboard-modules">
              {activeClasses.map((item) => (
                <article className="dashboard-module" key={item.id}>
                  <h3>{item.class_name} — {item.arm}</h3>
                  <p>Academic year: {item.academic_year}</p>
                  <p>Students assigned: {studentCount(item.id)}</p>

                  {studentCount(item.id) > 0 && (
                    <p>
                      Note: Students remain assigned to this class if it is
                      archived or moved to Trash. Review their assignments
                      before taking either action.
                    </p>
                  )}

                  <details>
                    <summary>More class management options</summary>

                    <form action={archiveClass}>
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
                        Archive class
                      </button>
                    </form>

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
                        Move class to Trash
                      </button>
                    </form>
                  </details>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Archived classes</h2>
          {archivedClasses.length === 0 ? (
            <p>No archived classes.</p>
          ) : (
            <div className="dashboard-modules">
              {archivedClasses.map((item) => (
                <article className="dashboard-module" key={item.id}>
                  <h3>{item.class_name} — {item.arm}</h3>
                  <p>Academic year: {item.academic_year}</p>
                  <p>Students assigned: {studentCount(item.id)}</p>

                  <form action={restoreClass}>
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
                    <button className="signin-button" type="submit">
                      Restore class
                    </button>
                  </form>

                  <details>
                    <summary>More options</summary>
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
                        Move to Trash
                      </button>
                    </form>
                  </details>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Trash</h2>
          <p>
            Trashed classes are hidden from normal class lists.
            Student assignments are not automatically removed.
          </p>

          {trashedClasses.length === 0 ? (
            <p>Trash is empty.</p>
          ) : (
            <div className="dashboard-modules">
              {trashedClasses.map((item) => (
                <article className="dashboard-module" key={item.id}>
                  <h3>{item.class_name} — {item.arm}</h3>
                  <p>Academic year: {item.academic_year}</p>
                  <p>Students assigned: {studentCount(item.id)}</p>

                  <form action={restoreClass}>
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
                    <button className="signin-button" type="submit">
                      Restore class
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
