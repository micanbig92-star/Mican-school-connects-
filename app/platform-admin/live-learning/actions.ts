
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlatformAdmin } from "@/lib/supabase/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createLiveTutorial(formData: FormData) {
  const user = await getPlatformAdmin();

  if (!user) redirect("/school-access");

  const title = String(formData.get("title") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const topic = String(formData.get("topic") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const startValue = String(formData.get("scheduledStart") || "");
  const endValue = String(formData.get("scheduledEnd") || "");
  const status = String(formData.get("status") || "draft");

  if (title.length < 3 || title.length > 180) {
    throw new Error("Tutorial title must contain 3–180 characters.");
  }
  if (subject.length < 2 || subject.length > 120) {
    throw new Error("Please enter a valid subject.");
  }
  if (topic.length < 2 || topic.length > 180) {
    throw new Error("Please enter a valid tutorial topic.");
  }
  if (description.length > 5000) {
    throw new Error("Description is too long.");
  }
  if (!["draft", "published"].includes(status)) {
    throw new Error("Invalid tutorial status.");
  }

  // Initial scheduling uses Nigeria's West Africa Time (UTC+1).
  const scheduledStart = new Date(`${startValue}:00+01:00`);
  const scheduledEnd = new Date(`${endValue}:00+01:00`);

  if (
    !startValue ||
    !endValue ||
    Number.isNaN(scheduledStart.getTime()) ||
    Number.isNaN(scheduledEnd.getTime()) ||
    scheduledEnd <= scheduledStart
  ) {
    throw new Error("Please enter a valid start and end time.");
  }

  const admin = createAdminClient();

  const { error } = await admin.from("live_tutorials").insert({
    title,
    subject,
    topic,
    description,
    scheduled_start: scheduledStart.toISOString(),
    scheduled_end: scheduledEnd.toISOString(),
    status,
    created_by: user.id,
  });

  if (error) {
    console.error("Tutorial creation failed:", error.message);
    throw new Error("Unable to create tutorial. Please try again.");
  }

  revalidatePath("/platform-admin/live-learning");
  revalidatePath("/platform-admin");
}

export async function assignLiveTutorial(formData: FormData) {
  const user = await getPlatformAdmin();

  if (!user) redirect("/school-access");

  const tutorialId = String(formData.get("tutorialId") || "").trim();
  const teacherId = String(formData.get("teacherId") || "").trim();

  if (!UUID.test(tutorialId) || !UUID.test(teacherId)) {
    throw new Error("Please select a valid tutorial and teacher.");
  }

  const admin = createAdminClient();

  const [
    { data: tutorial, error: tutorialError },
    { data: teacher, error: teacherError },
  ] = await Promise.all([
    admin
      .from("live_tutorials")
      .select("id, status")
      .eq("id", tutorialId)
      .maybeSingle(),
    admin
      .from("platform_live_teachers")
      .select("id, status")
      .eq("id", teacherId)
      .maybeSingle(),
  ]);

  if (tutorialError || !tutorial || tutorial.status !== "published") {
    throw new Error("Only an existing published tutorial can be assigned.");
  }

  if (teacherError || !teacher || teacher.status !== "approved") {
    throw new Error(
      "Only an approved MICAN Live Learning teacher can be assigned."
    );
  }

  const { error: assignmentError } = await admin
    .from("live_tutorial_teacher_assignments")
    .insert({
      tutorial_id: tutorialId,
      teacher_id: teacherId,
      assigned_by: user.id,
    });

  if (assignmentError) {
    if (assignmentError.code === "23505") {
      throw new Error("This tutorial is already assigned to that teacher.");
    }

    console.error("Live tutorial assignment failed:", assignmentError.message);
    throw new Error("Unable to assign this tutorial. Please try again.");
  }

  revalidatePath("/platform-admin/live-learning");
  revalidatePath("/live-learning/teacher");
  redirect("/platform-admin/live-learning?assignment=success");
}
