"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireSchoolManager } from "@/lib/supabase/school-manager";

function validId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function createStudentLogin(formData: FormData) {
  const schoolId = String(formData.get("schoolId") || "").trim();
  const studentId = String(formData.get("studentId") || "").trim();

  if (!validId(studentId)) {
    return { success: false, message: "Invalid student record." };
  }

  const { admin } = await requireSchoolManager(schoolId);

  const { data: school, error: schoolError } = await admin
    .from("schools")
    .select("school_code")
    .eq("id", schoolId)
    .eq("status", "approved")
    .single();

  if (schoolError || !school?.school_code) {
    return { success: false, message: "Unable to verify school code." };
  }

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, admission_number, full_name, status, auth_user_id")
    .eq("id", studentId)
    .eq("school_id", schoolId)
    .single();

  if (studentError || !student) {
    return { success: false, message: "Student record was not found." };
  }

  if (student.status !== "active") {
    return { success: false, message: "Only active students can receive login accounts." };
  }

  if (student.auth_user_id) {
    return { success: false, message: "This student already has a login account." };
  }

  const temporaryPassword = randomBytes(12).toString("base64url");
  const loginEmail = `student-${student.id}@accounts.mican-schools-connect.com`;

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: loginEmail,
      password: temporaryPassword,
      email_confirm: true,
    });

  if (createError || !created.user) {
    console.error("Student account creation failed:", createError?.message);
    return { success: false, message: "Unable to create the student login account." };
  }

  const { error: linkError } = await admin
    .from("students")
    .update({ auth_user_id: created.user.id })
    .eq("id", student.id)
    .eq("school_id", schoolId)
    .is("auth_user_id", null);

  if (linkError) {
    await admin.auth.admin.deleteUser(created.user.id);
    console.error("Student account linking failed:", linkError.message);
    return { success: false, message: "The account could not be linked to the student record." };
  }

  revalidatePath(`/school-dashboard/students/${schoolId}`);

  return {
    success: true,
    studentName: student.full_name,
    username: `${school.school_code}/${student.admission_number}`,
    temporaryPassword,
    message: "Student login account created successfully.",
  };
}