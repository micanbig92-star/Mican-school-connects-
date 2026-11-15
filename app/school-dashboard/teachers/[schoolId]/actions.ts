
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

const validGenders = ["female", "male", "prefer_not_to_say"];
const validEmploymentTypes = ["full_time", "part_time", "contract"];
const validStatuses = ["active", "inactive", "on_leave"];

function validateTeacher(formData: FormData) {
  const staffNumber = field(formData, "staffNumber");
  const fullName = field(formData, "fullName");
  const email = field(formData, "email");
  const phone = field(formData, "phone");
  const gender = field(formData, "gender");
  const subject = field(formData, "subjectSpecialisation");
  const employmentType = field(formData, "employmentType");
  const joinedOn = field(formData, "joinedOn");

  if (
    staffNumber.length < 1 ||
    staffNumber.length > 40 ||
    fullName.length < 2 ||
    fullName.length > 160
  ) {
    throw new Error("Enter a valid staff number and teacher name.");
  }

  if (
    email &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
  ) {
    throw new Error("Enter a valid email address.");
  }

  if (phone.length > 40 || subject.length > 160) {
    throw new Error("Phone number or subject specialisation is too long.");
  }

  if (gender && !validGenders.includes(gender)) {
    throw new Error("Choose a valid gender.");
  }

  if (!validEmploymentTypes.includes(employmentType)) {
    throw new Error("Choose a valid employment type.");
  }

  if (joinedOn && !/^\d{4}-\d{2}-\d{2}$/.test(joinedOn)) {
    throw new Error("Enter a valid joining date.");
  }

  return {
    staff_number: staffNumber,
    full_name: fullName,
    email: email || null,
    phone: phone || null,
    gender: gender || null,
    subject_specialisation: subject || null,
    employment_type: employmentType,
    joined_on: joinedOn || null,
  };
}

export async function createTeacher(formData: FormData) {
  const schoolId = field(formData, "schoolId");
  const teacher = validateTeacher(formData);

  const { admin, user } = await requireSchoolManager(schoolId);

  const { error } = await admin.from("teachers").insert({
    ...teacher,
    school_id: schoolId,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("This staff number is already registered.");
    }

    console.error(error.message);
    throw new Error("Unable to register teacher.");
  }

  revalidatePath(`/school-dashboard/teachers/${schoolId}`);
}

export async function updateTeacher(formData: FormData) {
  const schoolId = field(formData, "schoolId");
  const teacherId = field(formData, "teacherId");
  const status = field(formData, "status");

  if (!validId(teacherId)) {
    throw new Error("Invalid teacher record.");
  }

  if (!validStatuses.includes(status)) {
    throw new Error("Choose a valid teacher status.");
  }

  const teacher = validateTeacher(formData);
  const { admin } = await requireSchoolManager(schoolId);

  const { error } = await admin
    .from("teachers")
    .update({
      ...teacher,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", teacherId)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23505") {
      throw new Error("That staff number is already registered.");
    }

    console.error(error.message);
    throw new Error("Unable to update teacher.");
  }

  revalidatePath(`/school-dashboard/teachers/${schoolId}`);
}

export async function deleteTeacher(formData: FormData) {
  const schoolId = field(formData, "schoolId");
  const teacherId = field(formData, "teacherId");

  if (!validId(teacherId)) {
    throw new Error("Invalid teacher record.");
  }

  const { admin } = await requireSchoolManager(schoolId);

  const { error } = await admin
    .from("teachers")
    .delete()
    .eq("id", teacherId)
    .eq("school_id", schoolId);

  if (error) {
    console.error(error.message);
    throw new Error("Unable to delete teacher.");
  }

  revalidatePath(`/school-dashboard/teachers/${schoolId}`);
}
