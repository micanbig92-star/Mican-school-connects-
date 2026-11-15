"use server";

import { revalidatePath } from "next/cache";
import { requireSchoolManager } from "@/lib/supabase/school-manager";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function validId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

const validStatuses = ["present", "absent", "late", "excused"];

export async function saveAttendance(formData: FormData) {
  const schoolId = field(formData, "schoolId");
  const classId = field(formData, "classId");
  const attendanceDate = field(formData, "attendanceDate");

  if (!validId(classId)) {
    throw new Error("Choose a valid class.");
  }

  if (!validDate(attendanceDate)) {
    throw new Error("Choose a valid attendance date.");
  }

  const { admin, user } = await requireSchoolManager(schoolId);

  const { data: schoolClass, error: classError } = await admin
    .from("school_classes")
    .select("id")
    .eq("id", classId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (classError || !schoolClass) {
    throw new Error("This class does not belong to your school.");
  }

  const studentIds = [
    ...new Set(
      formData
        .getAll("studentId")
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    ),
  ];

  if (studentIds.length === 0 || studentIds.length > 500) {
    throw new Error("No valid students were submitted.");
  }

  if (!studentIds.every(validId)) {
    throw new Error("Invalid student record.");
  }

  const { data: students, error: studentsError } = await admin
    .from("students")
    .select("id")
    .eq("school_id", schoolId)
    .eq("class_id", classId)
    .eq("status", "active")
    .in("id", studentIds);

  if (studentsError || !students || students.length !== studentIds.length) {
    throw new Error(
      "Some students are no longer active or do not belong to this class."
    );
  }

  const records = studentIds.map((studentId) => {
    const status = field(formData, `status_${studentId}`);
    const note = field(formData, `note_${studentId}`);

    if (!validStatuses.includes(status)) {
      throw new Error("Choose an attendance status for every student.");
    }

    if (note.length > 300) {
      throw new Error("An attendance note is too long.");
    }

    return {
      school_id: schoolId,
      student_id: studentId,
      class_id: classId,
      attendance_date: attendanceDate,
      status,
      note: note || null,
      marked_by: user.id,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await admin
    .from("attendance_records")
    .upsert(records, {
      onConflict: "school_id,student_id,attendance_date",
    });

  if (error) {
    console.error(error.message);
    throw new Error("Unable to save attendance records.");
  }

  revalidatePath(`/school-dashboard/attendance/${schoolId}`);
}