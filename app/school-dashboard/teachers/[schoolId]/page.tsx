
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolManager } from "@/lib/supabase/school-manager";
import {
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from "./actions";

type Props = {
  params: Promise<{ schoolId: string }>;
};

export default async function TeachersPage({ params }: Props) {
  const { schoolId } = await params;
  const { admin, school } = await requireSchoolManager(schoolId);

  const { data: teachers, error } = await admin
    .from("teachers")
    .select(
      "id, staff_number, full_name, email, phone, gender, subject_specialisation, employment_type, status, joined_on"
    )
    .eq("school_id", schoolId)
    .order("full_name", { ascending: true });

  if (error || !teachers) {
    notFound();
  }

  const activeCount = teachers.filter(
    (teacher) => teacher.status === "active"
  ).length;

  const leaveCount = teachers.filter(
    (teacher) => teacher.status === "on_leave"
  ).length;

  return (
    <main className="school-dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-brand">MICAN SCHOOLS CONNECT</p>
            <span className="dashboard-label">TEACHER MANAGEMENT</span>
          </div>

          <Link href="/school-dashboard">Back to dashboard</Link>
        </header>

        <section className="dashboard-welcome">
          <p className="dashboard-kicker">SCHOOL WORKSPACE</p>
          <h1>Teacher Management</h1>
          <p>{school.school_name}</p>
        </section>

        <section className="dashboard-stats">
          <article className="dashboard-stat">
            <span className="stat-icon">👩‍🏫</span>
            <p>Total teachers</p>
            <strong>{teachers.length}</strong>
          </article>

          <article className="dashboard-stat">
            <span className="stat-icon">✅</span>
            <p>Active teachers</p>
            <strong>{activeCount}</strong>
          </article>

          <article className="dashboard-stat">
            <span className="stat-icon">📅</span>
            <p>On leave</p>
            <strong>{leaveCount}</strong>
          </article>
        </section>

        <section className="dashboard-section">
          <h2>Register a teacher</h2>
          <p>Add a teacher to your school's staff records.</p>

          <form action={createTeacher} className="signin-card">
            <input type="hidden" name="schoolId" value={schoolId} />

            <label>Teacher full name</label>
            <input
              className="signin-input"
              name="fullName"
              placeholder="Enter teacher's full name"
              required
              minLength={2}
              maxLength={160}
            />

            <label>Staff number</label>
            <input
              className="signin-input"
              name="staffNumber"
              placeholder="Example: TCH/2026/001"
              required
              maxLength={40}
            />

            <label>Email address</label>
            <input
              className="signin-input"
              name="email"
              type="email"
              placeholder="Teacher's email"
              maxLength={254}
            />

            <label>Phone number</label>
            <input
              className="signin-input"
              name="phone"
              placeholder="Teacher's phone number"
              maxLength={40}
            />

            <label>Gender</label>
            <select
              className="signin-input"
              name="gender"
              defaultValue=""
            >
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>

            <label>Subject specialisation</label>
            <input
              className="signin-input"
              name="subjectSpecialisation"
              placeholder="Example: Mathematics"
              maxLength={160}
            />

            <label>Employment type</label>
            <select
              className="signin-input"
              name="employmentType"
              defaultValue="full_time"
              required
            >
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
              <option value="contract">Contract</option>
            </select>

            <label>Joining date</label>
            <input
              className="signin-input"
              name="joinedOn"
              type="date"
            />

            <button className="signin-button" type="submit">
              Register teacher
            </button>
          </form>
        </section>

        <section className="dashboard-section">
          <h2>Registered teachers</h2>
          <p>{teachers.length} teacher records</p>

          {teachers.length === 0 ? (
            <p>No teachers have been registered yet.</p>
          ) : (
            <div className="dashboard-modules">
              {teachers.map((teacher) => (
                <article className="dashboard-module" key={teacher.id}>
                  <h3>{teacher.full_name}</h3>

                  <p>Staff number: {teacher.staff_number}</p>
                  <p>Subject: {teacher.subject_specialisation || "Not specified"}</p>
                  <p>Email: {teacher.email || "Not provided"}</p>
                  <p>Phone: {teacher.phone || "Not provided"}</p>
                  <p>
                    Employment: {teacher.employment_type.replace("_", " ")}
                  </p>
                  <p>
                    Status: {teacher.status.replace("_", " ")}
                  </p>

                  <details>
                    <summary>Edit teacher record</summary>

                    <form action={updateTeacher} className="signin-card">
                      <input
                        type="hidden"
                        name="schoolId"
                        value={schoolId}
                      />
                      <input
                        type="hidden"
                        name="teacherId"
                        value={teacher.id}
                      />

                      <label>Full name</label>
                      <input
                        className="signin-input"
                        name="fullName"
                        defaultValue={teacher.full_name}
                        required
                        minLength={2}
                        maxLength={160}
                      />

                      <label>Staff number</label>
                      <input
                        className="signin-input"
                        name="staffNumber"
                        defaultValue={teacher.staff_number}
                        required
                        maxLength={40}
                      />

                      <label>Email</label>
                      <input
                        className="signin-input"
                        name="email"
                        type="email"
                        defaultValue={teacher.email || ""}
                        maxLength={254}
                      />

                      <label>Phone</label>
                      <input
                        className="signin-input"
                        name="phone"
                        defaultValue={teacher.phone || ""}
                        maxLength={40}
                      />

                      <label>Gender</label>
                      <select
                        className="signin-input"
                        name="gender"
                        defaultValue={teacher.gender || ""}
                      >
                        <option value="">Not specified</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>

                      <label>Subject specialisation</label>
                      <input
                        className="signin-input"
                        name="subjectSpecialisation"
                        defaultValue={teacher.subject_specialisation || ""}
                        maxLength={160}
                      />

                      <label>Employment type</label>
                      <select
                        className="signin-input"
                        name="employmentType"
                        defaultValue={teacher.employment_type}
                      >
                        <option value="full_time">Full time</option>
                        <option value="part_time">Part time</option>
                        <option value="contract">Contract</option>
                      </select>

                      <label>Joining date</label>
                      <input
                        className="signin-input"
                        name="joinedOn"
                        type="date"
                        defaultValue={teacher.joined_on || ""}
                      />

                      <label>Teacher status</label>
                      <select
                        className="signin-input"
                        name="status"
                        defaultValue={teacher.status}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On leave</option>
                      </select>

                      <button className="signin-button" type="submit">
                        Save changes
                      </button>
                    </form>
                  </details>

                  <details>
                    <summary>Delete teacher record</summary>
                    <p>
                      Only delete this record if it is no longer needed.
                    </p>

                    <form action={deleteTeacher}>
                      <input
                        type="hidden"
                        name="schoolId"
                        value={schoolId}
                      />
                      <input
                        type="hidden"
                        name="teacherId"
                        value={teacher.id}
                      />

                      <button className="signin-button" type="submit">
                        Delete teacher
                      </button>
                    </form>
                  </details>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          One Network. Many Schools. One Connected Future.
          <br />
          © MICAN Technologies
        </footer>
      </div>
    </main>
  );
}
