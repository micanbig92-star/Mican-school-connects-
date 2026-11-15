
"use server";

import { revalidatePath } from "next/cache";
import { requireSchoolManager } from "@/lib/supabase/school-manager";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function validId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// CREATE CLASS
export async function createClass(formData: FormData) {
  const schoolId = field(formData, "schoolId");
  const className = field(formData, "className");
  const arm = field(formData, "arm") || "A";
  const academicYear = field(formData, "academicYear");

  if (!className || className.length > 80 ||
      arm.length > 30 || academicYear.length < 4 ||
      academicYear.length > 20) {
    throw new Error("Enter valid class details.");
  }

  const { admin } = await requireSchoolManager(schoolId);

  const { error } = await admin.from("school_classes").insert({
    school_id: schoolId,
    class_name: className,
    arm,
    academic_year: academicYear,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("This class already exists for that academic year.");
    }
    console.error(error.message);
    throw new Error("Unable to create class.");
  }

  revalidatePath(`/school-dashboard/classes/${schoolId}`);
}

// UPDATE CLASS
export async function updateClass(formData: FormData) {
  const schoolId = field(formData, "schoolId");
  const classId = field(formData, "classId");
  const className = field(formData, "className");
  const arm = field(formData, "arm") || "A";
  const academicYear = field(formData, "academicYear");

  if (!validId(classId) || !className || className.length > 80 ||
      arm.length > 30 || academicYear.length < 4 ||
      academicYear.length > 20) {
    throw new Error("Enter valid class details.");
  }

  const { admin } = await requireSchoolManager(schoolId);

  const { error } = await admin.from("school_classes")
    .update({
      class_name: className,
      arm,
      academic_year: academicYear,
      updated_at: new Date().toISOString(),
    })
    .eq("id", classId)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23505") {
      throw new Error("That class already exists.");
    }
    throw new Error("Unable to update class.");
  }

  revalidatePath(`/school-dashboard/classes/${schoolId}`);
}

// DELETE CLASS
export async function deleteClass(formData: FormData) {
  const schoolId = field(formData, "schoolId");
  const classId = field(formData, "classId");

  if (!validId(classId)) throw new Error("Invalid class.");

  const { admin } = await requireSchoolManager(schoolId);

  const { error } = await admin.from("school_classes")
    .delete()
    .eq("id", classId)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23503") {
      throw new Error("Move students out of this class before deleting it.");
    }
    throw new Error("Unable to delete class.");
  }

  revalidatePath(`/school-dashboard/classes/${schoolId}`);
}

// CREATE STUDENT
export async function createStudent(formData: FormData) {
  const schoolId = field(formData, "schoolId");
  const admissionNumber = field(formData, "admissionNumber");
  const fullName = field(formData, "fullName");
  const classId = field(formData, "classId");
  const gender = field(formData, "gender");

  if (!admissionNumber || admissionNumber.length > 40 ||
      fullName.length < 2 || fullName.length > 160) {
    throw new Error("Enter a valid admission number and student name.");
  }

  if (classId && !validId(classId)) {
    throw new Error("Choose a valid class.");
  }

  if (gender && !["female", "male", "prefer_not_to_say"].includes(gender)) {
    throw new Error("Choose a valid gender.");
  }

  const { admin } = await requireSchoolManager(schoolId);

  const { error } = await admin.from("students").insert({
    school_id: schoolId,
    class_id: classId || null,
    admission_number: admissionNumber,
    full_name: fullName,
    gender: gender || null,
    guardian_name: field(formData, "guardianName") || null,
    guardian_phone: field(formData, "guardianPhone") || null,
    guardian_email: field(formData, "guardianEmail") || null,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("This admission number is already registered.");
    }
    console.error(error.message);
    throw new Error("Unable to register student.");
  }

  revalidatePath(`/school-dashboard/students/${schoolId}`);
}

// UPDATE STUDENT
export async function updateStudent(formData: FormData) {
  const schoolId = field(formData, "schoolId");
  const studentId = field(formData, "studentId");
  const admissionNumber = field(formData, "admissionNumber");
  const fullName = field(formData, "fullName");
  const classId = field(formData, "classId");
  const gender = field(formData, "gender");
  const status = field(formData, "status");

  if (!validId(studentId) || !admissionNumber ||
      admissionNumber.length > 40 ||
      fullName.length < 2 || fullName.length > 160) {
    throw new Error("Enter valid student details.");
  }

  if (classId && !validId(classId)) {
    throw new Error("Choose a valid class.");
  }

  if (gender && !["female", "male", "prefer_not_to_say"].includes(gender)) {
    throw new Error("Choose a valid gender.");
  }

  if (!["active", "inactive", "graduated", "withdrawn"].includes(status)) {
    throw new Error("Choose a valid student status.");
  }

  const { admin } = await requireSchoolManager(schoolId);

  const { error } = await admin.from("students")
    .update({
      class_id: classId || null,
      admission_number: admissionNumber,
      full_name: fullName,
      gender: gender || null,
      guardian_name: field(formData, "guardianName") || null,
      guardian_phone: field(formData, "guardianPhone") || null,
      guardian_email: field(formData, "guardianEmail") || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", studentId)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23505") {
      throw new Error("This admission number is already registered.");
    }
    throw new Error("Unable to update student.");
  }

  revalidatePath(`/school-dashboard/students/${schoolId}`);
}

// DELETE STUDENT
export async function deleteStudent(formData: FormData) {
  const schoolId = field(formData, "schoolId");
  const studentId = field(formData, "studentId");

  if (!validId(studentId)) throw new Error("Invalid student.");

  const { admin } = await requireSchoolManager(schoolId);

  const { error } = await admin.from("students")
    .delete()
    .eq("id", studentId)
    .eq("school_id", schoolId);

  if (error) {
    throw new Error("Unable to delete student.");
  }

  revalidatePath(`/school-dashboard/students/${schoolId}`);
}
