
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolManager } from "@/lib/supabase/school-manager";
import {
  createStudent,
  updateStudent,
  archiveStudent,
  restoreStudent,
  deleteStudent,
} from "../../actions";
import StudentLoginControls from "./student-login-controls";

type Props = {
  params: Promise<{ schoolId: string }>;
};

export default async function StudentsPage({ params }: Props) {
  const { schoolId } = await params;
  const { admin, school } = await requireSchoolManager(schoolId);

  const [
    { data: students, error: studentsError },
    { data: classes, error: classesError },
  ] = await Promise.all([
    admin
      .from("students")
      .select(
        "id, admission_number, full_name, class_id, gender, guardian_name, guardian_phone, guardian_email, status, auth_user_id, archived_at, deleted_at"
      )
      .eq("school_id", schoolId)
      .order("full_name", { ascending: true }),
    admin
      .from("school_classes")
      .select("id, class_name, arm, academic_year")
      .eq("school_id", schoolId)
      .is("archived_at", null)
      .is("deleted_at", null)
      .order("class_name", { ascending: true }),
  ]);

  if (studentsError || classesError || !students || !classes) {
    notFound();
  }

  const activeStudents = students.filter(
    (student) => !student.archived_at && !student.deleted_at
  );

  const archivedStudents = students.filter(
    (student) => student.archived_at && !student.deleted_at
  );

  const trashedStudents = students.filter(
    (student) => Boolean(student.deleted_at)
  );

  const classNames = new Map(
    classes.map((item) => [
      item.id,
      `${item.class_name} ${item.arm}`,
    ])
  );

  return (
    <main className="school-dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-brand">MICAN SCHOOLS CONNECT</p>
            <span className="dashboard-label">STUDENT MANAGEMENT</span>
          </div>
          <Link href="/school-dashboard">Back to dashboard</Link>
        </header>

        <section className="dashboard-welcome">
          <p className="dashboard-kicker">SCHOOL WORKSPACE</p>
          <h1>Student Management</h1>
          <p>{school.school_name}</p>
        </section>

        <section className="dashboard-section">
          <h2>Student records overview</h2>
          <div className="dashboard-modules">
            <article className="dashboard-module">
              <h3>Active students</h3>
              <p>{activeStudents.length}</p>
            </article>
            <article className="dashboard-module">
              <h3>Archived students</h3>
              <p>{archivedStudents.length}</p>
            </article>
            <article className="dashboard-module">
              <h3>Students in Trash</h3>
              <p>{trashedStudents.length}</p>
            </article>
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Register a student</h2>
          <p>Enter the student's details below.</p>

          <form action={createStudent} className="signin-card">
            <input type="hidden" name="schoolId" value={schoolId} />

            <label>Student full name</label>
            <input
              className="signin-input"
              name="fullName"
              placeholder="Enter full name"
              required
              minLength={2}
              maxLength={160}
            />

            <label>Admission number</label>
            <input
              className="signin-input"
              name="admissionNumber"
              placeholder="Example: MSC/2026/001"
              required
              maxLength={40}
            />

            <label>Class</label>
            <select className="signin-input" name="classId" defaultValue="">
              <option value="">Not assigned</option>
              {classes.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.class_name} {item.arm} ({item.academic_year})
                </option>
              ))}
            </select>

            <label>Gender (optional)</label>
            <select className="signin-input" name="gender" defaultValue="">
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>

            <label>Guardian name</label>
            <input
              className="signin-input"
              name="guardianName"
              placeholder="Parent or guardian name"
              maxLength={160}
            />

            <label>Guardian phone</label>
            <input
              className="signin-input"
              name="guardianPhone"
              placeholder="Phone number"
              maxLength={40}
            />

            <label>Guardian email</label>
            <input
              className="signin-input"
              name="guardianEmail"
              type="email"
              placeholder="Email address"
              maxLength={254}
            />

            <button className="signin-button" type="submit">
              Register student
            </button>
          </form>
        </section>

        <section className="dashboard-section">
          <h2>Active students</h2>
          <p>{activeStudents.length} active student records</p>

          {activeStudents.length === 0 ? (
            <p>No active students found.</p>
          ) : (
            <div className="dashboard-modules">
              {activeStudents.map((student) => (
                <article className="dashboard-module" key={student.id}>
                  <h3>{student.full_name}</h3>
                  <p>Admission number: {student.admission_number}</p>
                  <p>
                    Class:{" "}
                    {student.class_id
                      ? classNames.get(student.class_id) || "Unassigned or hidden class"
                      : "Unassigned"}
                  </p>

                  <div className="my-4">
                    <StudentLoginControls
                      schoolId={schoolId}
                      studentId={student.id}
                      hasLogin={Boolean(student.auth_user_id)}
                    />
                  </div>

                  <details>
                    <summary>More student management options</summary>

                    <form action={updateStudent} className="signin-card">
                      <input
                        type="hidden"
                        name="schoolId"
                        value={schoolId}
                      />
                      <input
                        type="hidden"
                        name="studentId"
                        value={student.id}
                      />

                      <label>Full name</label>
                      <input
                        className="signin-input"
                        name="fullName"
                        defaultValue={student.full_name}
                        required
                        minLength={2}
                        maxLength={160}
                      />

                      <label>Admission number</label>
                      <input
                        className="signin-input"
                        name="admissionNumber"
                        defaultValue={student.admission_number}
                        required
                        maxLength={40}
                      />

                      <label>Class</label>
                      <select
                        className="signin-input"
                        name="classId"
                        defaultValue={
                          classes.some((item) => item.id === student.class_id)
                            ? student.class_id || ""
                            : ""
                        }
                      >
                        <option value="">Not assigned</option>
                        {classes.map((item) => (
                          <option value={item.id} key={item.id}>
                            {item.class_name} {item.arm} ({item.academic_year})
                          </option>
                        ))}
                      </select>

                      <label>Gender</label>
                      <select
                        className="signin-input"
                        name="gender"
                        defaultValue={student.gender || ""}
                      >
                        <option value="">Not specified</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="prefer_not_to_say">
                          Prefer not to say
                        </option>
                      </select>

                      <label>Guardian name</label>
                      <input
                        className="signin-input"
                        name="guardianName"
                        defaultValue={student.guardian_name || ""}
                        maxLength={160}
                      />

                      <label>Guardian phone</label>
                      <input
                        className="signin-input"
                        name="guardianPhone"
                        defaultValue={student.guardian_phone || ""}
                        maxLength={40}
                      />

                      <label>Guardian email</label>
                      <input
                        className="signin-input"
                        name="guardianEmail"
                        type="email"
                        defaultValue={student.guardian_email || ""}
                        maxLength={254}
                      />

                      <label>Student status</label>
                      <select
                        className="signin-input"
                        name="status"
                        defaultValue={student.status}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="graduated">Graduated</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>

                      <button className="signin-button" type="submit">
                        Save changes
                      </button>
                    </form>

                    <form action={archiveStudent}>
                      <input
                        type="hidden"
                        name="schoolId"
                        value={schoolId}
                      />
                      <input
                        type="hidden"
                        name="studentId"
                        value={student.id}
                      />
                      <button className="dashboard-signout" type="submit">
                        Archive student
                      </button>
                    </form>

                    <form action={deleteStudent}>
                      <input
                        type="hidden"
                        name="schoolId"
                        value={schoolId}
                      />
                      <input
                        type="hidden"
                        name="studentId"
                        value={student.id}
                      />
                      <button className="dashboard-signout" type="submit">
                        Move student to Trash
                      </button>
                    </form>
                  </details>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Archived students</h2>
          <p>Archived records are hidden from the active student list.</p>

          {archivedStudents.length === 0 ? (
            <p>No archived students.</p>
          ) : (
            <div className="dashboard-modules">
              {archivedStudents.map((student) => (
                <article className="dashboard-module" key={student.id}>
                  <h3>{student.full_name}</h3>
                  <p>Admission number: {student.admission_number}</p>

                  <form action={restoreStudent}>
                    <input
                      type="hidden"
                      name="schoolId"
                      value={schoolId}
                    />
                    <input
                      type="hidden"
                      name="studentId"
                      value={student.id}
                    />
                    <button className="signin-button" type="submit">
                      Restore student
                    </button>
                  </form>

                  <details>
                    <summary>More options</summary>
                    <form action={deleteStudent}>
                      <input
                        type="hidden"
                        name="schoolId"
                        value={schoolId}
                      />
                      <input
                        type="hidden"
                        name="studentId"
                        value={student.id}
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
            These records are soft-deleted and can still be restored.
            They have not been permanently deleted.
          </p>

          {trashedStudents.length === 0 ? (
            <p>Trash is empty.</p>
          ) : (
            <div className="dashboard-modules">
              {trashedStudents.map((student) => (
                <article className="dashboard-module" key={student.id}>
                  <h3>{student.full_name}</h3>
                  <p>Admission number: {student.admission_number}</p>

                  <form action={restoreStudent}>
                    <input
                      type="hidden"
                      name="schoolId"
                      value={schoolId}
                    />
                    <input
                      type="hidden"
                      name="studentId"
                      value={student.id}
                    />
                    <button className="signin-button" type="submit">
                      Restore student
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
