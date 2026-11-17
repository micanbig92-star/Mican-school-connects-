
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolManager } from "@/lib/supabase/school-manager";
import {
  createStudent,
  updateStudent,
  deleteStudent,
} from "../../actions";
import StudentLoginControls from "./student-login-controls";

type Props = {
  params: Promise<{ schoolId: string }>;
};

export default async function StudentsPage({ params }: Props) {
  const { schoolId } = await params;
  const { admin, school } = await requireSchoolManager(schoolId);

  const [{ data: students, error: studentsError }, { data: classes }] =
    await Promise.all([
      admin
        .from("students")
        .select(
          "id, admission_number, full_name, class_id, gender, guardian_name, guardian_phone, guardian_email, status, auth_user_id"
        )
        .eq("school_id", schoolId)
        .order("full_name", { ascending: true }),
      admin
        .from("school_classes")
        .select("id, class_name, arm, academic_year")
        .eq("school_id", schoolId)
        .order("class_name", { ascending: true }),
    ]);

  if (studentsError || !classes) notFound();

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
          <h2>Registered students</h2>
          <p>{students?.length || 0} student records</p>

          {!students?.length ? (
            <p>No students have been registered yet.</p>
          ) : (
            <div className="dashboard-modules">
              {students.map((student) => (
                <article className="dashboard-module" key={student.id}>
                  <h3>{student.full_name}</h3>
                  <p>Admission number: {student.admission_number}</p>
                  <p>
                    Class: {student.class_id
                      ? classNames.get(student.class_id) || "Unassigned"
                      : "Unassigned"}
                  </p>

                  <div className="my-4">
                    <StudentLoginControls
                      schoolId={schoolId}
                      studentId={student.id}
                      hasLogin={Boolean(student.auth_user_id)}
                    />
                  </div>

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
                      defaultValue={student.class_id || ""}
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
                      <option value="prefer_not_to_say">Prefer not to say</option>
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
                      Delete student record
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
