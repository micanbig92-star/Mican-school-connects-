
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlatformAdmin } from "@/lib/supabase/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateSchoolStatus(formData: FormData) {
  const user = await getPlatformAdmin();

  if (!user) {
    redirect("/school-access");
  }

  const schoolId = formData.get("schoolId");
  const nextStatus = formData.get("status");

  if (
    typeof schoolId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(schoolId)
  ) {
    throw new Error("Invalid school application.");
  }

  if (
    nextStatus !== "approved" &&
    nextStatus !== "rejected" &&
    nextStatus !== "suspended"
  ) {
    throw new Error("Invalid school status.");
  }

  const admin = createAdminClient();

  const { error } = await admin.rpc("set_school_status", {
    p_school_id: schoolId,
    p_new_status: nextStatus,
  });

  if (error) {
    console.error("School status update failed:", error.message);
    throw new Error("Unable to update this school. Please try again.");
  }

  revalidatePath("/platform-admin");
  revalidatePath("/school-access");
}
