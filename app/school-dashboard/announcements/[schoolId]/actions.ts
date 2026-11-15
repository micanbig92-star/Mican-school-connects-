
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

const validAudiences = [
  "everyone",
  "students",
  "teachers",
  "parents",
];

const validPriorities = [
  "normal",
  "important",
  "urgent",
];

const validStatuses = [
  "draft",
  "published",
  "archived",
];

function validateAnnouncement(formData: FormData) {
  const title = field(formData, "title");
  const body = field(formData, "body");
  const audience = field(formData, "audience");
  const priority = field(formData, "priority");
  const status = field(formData, "status");

  if (title.length < 3 || title.length > 160) {
    throw new Error("The title must contain 3 to 160 characters.");
  }

  if (body.length < 1 || body.length > 5000) {
    throw new Error("The message must contain 1 to 5000 characters.");
  }

  if (!validAudiences.includes(audience)) {
    throw new Error("Choose a valid announcement audience.");
  }

  if (!validPriorities.includes(priority)) {
    throw new Error("Choose a valid announcement priority.");
  }

  if (!validStatuses.includes(status)) {
    throw new Error("Choose a valid announcement status.");
  }

  return {
    title,
    body,
    audience,
    priority,
    status,
    published_at:
      status === "published"
        ? new Date().toISOString()
        : null,
    updated_at: new Date().toISOString(),
  };
}

export async function createAnnouncement(formData: FormData) {
  const schoolId = field(formData, "schoolId");

  const announcement = validateAnnouncement(formData);

  const { admin, user } = await requireSchoolManager(schoolId);

  const { error } = await admin
    .from("school_announcements")
    .insert({
      ...announcement,
      school_id: schoolId,
      created_by: user.id,
    });

  if (error) {
    console.error(error.message);
    throw new Error("Unable to create announcement.");
  }

  revalidatePath(
    `/school-dashboard/announcements/${schoolId}`
  );
}

export async function updateAnnouncement(formData: FormData) {
  const schoolId = field(formData, "schoolId");
  const announcementId = field(formData, "announcementId");

  if (!validId(announcementId)) {
    throw new Error("Invalid announcement record.");
  }

  const announcement = validateAnnouncement(formData);

  const { admin } = await requireSchoolManager(schoolId);

  const { data, error } = await admin
    .from("school_announcements")
    .update(announcement)
    .eq("id", announcementId)
    .eq("school_id", schoolId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error(error?.message);
    throw new Error("Unable to update this announcement.");
  }

  revalidatePath(
    `/school-dashboard/announcements/${schoolId}`
  );
}

export async function deleteAnnouncement(formData: FormData) {
  const schoolId = field(formData, "schoolId");
  const announcementId = field(formData, "announcementId");

  if (!validId(announcementId)) {
    throw new Error("Invalid announcement record.");
  }

  const { admin } = await requireSchoolManager(schoolId);

  const { data, error } = await admin
    .from("school_announcements")
    .delete()
    .eq("id", announcementId)
    .eq("school_id", schoolId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error(error?.message);
    throw new Error("Unable to delete this announcement.");
  }

  revalidatePath(
    `/school-dashboard/announcements/${schoolId}`
  );
}
