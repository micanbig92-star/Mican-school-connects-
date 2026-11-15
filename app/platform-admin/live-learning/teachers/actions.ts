
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlatformAdmin } from "@/lib/supabase/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function updateTeacherApplication(
  formData: FormData,
  nextStatus: "approved" | "rejected"
) {
  const user = await getPlatformAdmin();

  if (!user) {
    redirect("/school-access");
  }

  const teacherId = String(formData.get("teacherId") || "").trim();

  if (!UUID.test(teacherId)) {
    throw new Error("Invalid teacher application.");
  }

  const admin = createAdminClient();

  const update =
    nextStatus === "approved"
      ? {
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        }
      : {
          status: "rejected",
          approved_by: null,
          approved_at: null,
        };

  const { data, error } = await admin
    .from("platform_live_teachers")
    .update(update)
    .eq("id", teacherId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Teacher application update failed:", error.message);
    throw new Error("Unable to update this application. Please try again.");
  }

  if (!data) {
    throw new Error(
      "This application is no longer pending. Refresh the page."
    );
  }

  revalidatePath("/platform-admin/live-learning/teachers");
  revalidatePath("/live-learning/teacher");
}

export async function approveLiveTeacher(formData: FormData) {
  await updateTeacherApplication(formData, "approved");
}

export async function rejectLiveTeacher(formData: FormData) {
  await updateTeacherApplication(formData, "rejected");
}
