import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolManager } from "@/lib/supabase/school-manager";
import { saveAttendance } from "./actions";

type Props = {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{
    classId?: string;
    date?: string;
  }>;
};

function getTodayInNigeria() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

const statusLabels: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

export default async function AttendancePage({
  params,
  searchParams,
}: Props) {
  const { schoolId } = await params;
  const filters = await searchParams;

  const { admin, school } = await requireSchoolManager(schoolId);

  const { data: classes, error: classesError } = await admin
    .from("school_classes")
    .select("id, class_name, arm, academic_year")
    .eq("school_id", schoolId)
    .order("class_name", { ascending: true });

  if (classesError) notFound();

  const selectedClassId =
    filters.classId && classes?.some((item) => item.id === filters.classId)
      ? filters.classId
      : classes?.[0]?.id || "";

  const selectedDate =
    filters.date && isValidDate(filters.date)
      ? filters.date
      : getTodayInNigeria();

  let students: {
    id: string;
    full_name: string;
    admission_number: string;
  }[] = [];

  let attendanceMap: Record<
    string,
    { status: string; note: string | null }
  > = {};

  let history: {
    student_id: string;
    attendance_date: string;
    status: string;
    full_name: string;
  }[] = [];

  if (selectedClassId) {
    const { data: studentData, error: studentError } = await admin
      .from("students")
      .select("id, full_name, admission_number")
      .eq("school_id", schoolId)
      .eq("class_id", selectedClassId)
      .eq("status", "active")
      .order("full_name", { ascending: true });

    if (studentError) notFound();

    students = studentData || [];

    const { data: savedRecords, error: attendanceError } = await admin
      .from("attendance_records")
      .select("student_id, status, note")
      .eq("school_id", schoolId)
      .eq("class_id", selectedClassId)
      .eq("attendance_date", selectedDate);

    if (attendanceError) notFound();

    for (const record of savedRecords || []) {
      attendanceMap[record.student_id] = {
        status: record.status,
        note: record.note,
      };
    }

    const { data: historyRecords, error: historyError } = await admin
      .from("attendance_records")
      .select("student_id, attendance_date, status")
      .eq("school_id", schoolId)
      .eq("class_id", selectedClassId)
      .order("attendance_date", { ascending: false })
      .limit(30);

    if (historyError) notFound();

    const historyStudentIds = [
      ...new Set((historyRecords || []).map((item) => item.student_id)),
    ];

    const { data: historyStudents } =
      historyStudentIds.length > 0
        ? await admin
            .from("students")
            .select("id, full_name")
            .eq("school_id", schoolId)
            .in("id", historyStudentIds)
        : { data: [] };

    const studentNames = new Map(
      (historyStudents || []).map((item) => [item.id, item.full_name])
    );

    history = (historyRecords || []).map((item) => ({
      ...item,
      full_name: studentNames.get(item.student_id) || "Student record",
    }));
  }

  const markedCount = students.filter(
    (student) => attendanceMap[student.id]
  ).length;

  const presentCount = students.filter(
    (student) => attendanceMap[student.id]?.status === "present"
  ).length;

  const absentCount = students.filter(
    (student) => attendanceMap[student.id]?.status === "absent"
  ).length;

  const lateCount = students.filter(
    (student) => attendanceMap[student.id]?.status === "late"
  ).length;

  const excusedCount = students.filter(
    (student) => attendanceMap[student.id]?.status === "excused"
  ).length;

  return (
    <main className="school-dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-brand">MICAN SCHOOLS CONNECT</p>
            <span className="dashboard-label">
              ATTENDANCE MANAGEMENT
            </span>
          </div>

          <Link href="/school-dashboard">Back to dashboard</Link>
        </header>

        <section className="dashboard-welcome">
          <p className="dashboard-kicker">SCHOOL WORKSPACE</p>
          <h1>Attendance Management</h1>
          <p>{school.school_name}</p>
          <p>
            Record daily attendance and review previous attendance records.
          </p>
        </section>

        <section className="dashboard-section">
          <h2>Select class and date</h2>

          <form
            method="GET"
            className="signin-card"
            action={`/school-dashboard/attendance/${schoolId}`}
          >
            <label htmlFor="classId">Select class</label>

            <select
              className="signin-input"
              id="classId"
              name="classId"
              defaultValue={selectedClassId}
              required
            >
              {classes?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.class_name} — {item.arm} ({item.academic_year})
                </option>
              ))}
            </select>

            <label htmlFor="attendanceDate">Attendance date</label>

            <input
              className="signin-input"
              id="attendanceDate"
              type="date"
              name="date"
              defaultValue={selectedDate}
              required
            />

            <button className="signin-button" type="submit">
              Load attendance
            </button>
          </form>
        </section>

        {!classes?.length ? (
          <section className="dashboard-section">
            <h2>No classes available</h2>
            <p>Create a class before recording attendance.</p>
            <Link href={`/school-dashboard/classes/${schoolId}`}>
              Open Class Management
            </Link>
          </section>
        ) : (
          <>
            <section className="dashboard-section">
              <h2>Daily attendance overview</h2>

              <div className="dashboard-stats">
                <article className="dashboard-stat">
                  <p>Total active students</p>
                  <strong>{students.length}</strong>
                </article>

                <article className="dashboard-stat">
                  <p>Present</p>
                  <strong>{presentCount}</strong>
                </article>

                <article className="dashboard-stat">
                  <p>Absent</p>
                  <strong>{absentCount}</strong>
                </article>

                <article className="dashboard-stat">
                  <p>Late</p>
                  <strong>{lateCount}</strong>
                </article>

                <article className="dashboard-stat">
                  <p>Excused</p>
                  <strong>{excusedCount}</strong>
                </article>
              </div>

              <p>
                {markedCount} of {students.length} students have saved
                attendance records for {selectedDate}.
              </p>
            </section>

            <section className="dashboard-section">
              <h2>Mark student attendance</h2>

              <p>
                Choose a status for every student, then save the attendance.
                You can update the records later.
              </p>

              {!students.length ? (
                <p>
                  No active students are registered in this class.
                  Add students through Student Management first.
                </p>
              ) : (
                <form action={saveAttendance} className="signin-card">
                  <input
                    type="hidden"
                    name="schoolId"
                    value={schoolId}
                  />

                  <input
                    type="hidden"
                    name="classId"
                    value={selectedClassId}
                  />

                  <input
                    type="hidden"
                    name="attendanceDate"
                    value={selectedDate}
                  />

                  {students.map((student, index) => {
                    const saved = attendanceMap[student.id];

                    return (
                      <div
                        className="dashboard-module"
                        key={student.id}
                        style={{ marginBottom: "16px" }}
                      >
                        <input
                          type="hidden"
                          name="studentId"
                          value={student.id}
                        />

                        <h3>
                          {index + 1}. {student.full_name}
                        </h3>

                        <p>
                          Admission number: {student.admission_number}
                        </p>

                        <label htmlFor={`status-${student.id}`}>
                          Attendance status
                        </label>

                        <select
                          className="signin-input"
                          id={`status-${student.id}`}
                          name={`status_${student.id}`}
                          defaultValue={saved?.status || "present"}
                          required
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </select>

                        <label htmlFor={`note-${student.id}`}>
                          Note (optional)
                        </label>

                        <input
                          className="signin-input"
                          id={`note-${student.id}`}
                          name={`note_${student.id}`}
                          placeholder="Optional attendance note"
                          maxLength={300}
                          defaultValue={saved?.note || ""}
                        />
                      </div>
                    );
                  })}

                  <button className="signin-button" type="submit">
                    Save attendance
                  </button>
                </form>
              )}
            </section>

            <section className="dashboard-section">
              <h2>Recent attendance history</h2>

              <p>
                Showing up to 30 recent attendance records for this class.
              </p>

              {!history.length ? (
                <p>No attendance history is available yet.</p>
              ) : (
                <div className="dashboard-modules">
                  {history.map((record, index) => (
                    <article
                      className="dashboard-module"
                      key={`${record.student_id}-${record.attendance_date}-${index}`}
                    >
                      <h3>{record.full_name}</h3>
                      <p>Date: {record.attendance_date}</p>
                      <p>
                        Status:{" "}
                        <strong>
                          {statusLabels[record.status] || record.status}
                        </strong>
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <footer className="dashboard-footer">
          One Network. Many Schools. One Connected Future.
          <br />
          © MICAN Technologies
        </footer>
      </div>
    </main>
  );
}