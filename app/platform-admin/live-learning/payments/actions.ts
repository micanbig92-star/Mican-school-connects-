
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlatformAdmin } from "@/lib/supabase/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireSuperAdmin() {
  const user = await getPlatformAdmin();

  if (!user) redirect("/school-access");

  return user;
}

export async function approveTutorialPayment(formData: FormData) {
  const user = await requireSuperAdmin();

  const requestId = String(formData.get("requestId") || "").trim();

  if (!UUID.test(requestId)) {
    throw new Error("Invalid payment request.");
  }

  const admin = createAdminClient();

  const { data: payment, error: paymentError } = await admin
    .from("live_tutorial_payment_requests")
    .select("id, status, school_id, tutorial_id")
    .eq("id", requestId)
    .maybeSingle();

  if (paymentError || !payment) {
    throw new Error("Payment request could not be found.");
  }

  if (payment.status !== "submitted") {
    throw new Error("Only submitted payments can be approved.");
  }

  const { error } = await admin.schema("private").rpc(
    "approve_live_tutorial_payment",
    {
      p_payment_request_id: requestId,
      p_reviewed_by: user.id,
    }
  );

  if (error) {
    console.error("Payment approval failed:", error.message);
    throw new Error(
      "Payment approval failed. Please refresh and check the request status."
    );
  }

  revalidatePath("/platform-admin/live-learning/payments");
  revalidatePath("/platform-admin/live-learning");
  revalidatePath(`/school-dashboard/live-learning/${payment.school_id}`);

  redirect("/platform-admin/live-learning/payments?review=approved");
}

export async function rejectTutorialPayment(formData: FormData) {
  const user = await requireSuperAdmin();

  const requestId = String(formData.get("requestId") || "").trim();
  const reviewNote = String(formData.get("reviewNote") || "").trim();

  if (!UUID.test(requestId)) {
    throw new Error("Invalid payment request.");
  }

  if (reviewNote.length < 3 || reviewNote.length > 1000) {
    throw new Error("Enter a rejection reason of 3–1000 characters.");
  }

  const admin = createAdminClient();

  const { data: payment, error: paymentError } = await admin
    .from("live_tutorial_payment_requests")
    .select("id, status, school_id")
    .eq("id", requestId)
    .maybeSingle();

  if (paymentError || !payment) {
    throw new Error("Payment request could not be found.");
  }

  if (payment.status !== "submitted") {
    throw new Error("Only submitted payments can be rejected.");
  }

  const { data: updated, error: updateError } = await admin
    .from("live_tutorial_payment_requests")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "submitted")
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    console.error("Payment rejection failed:", updateError?.message);
    throw new Error(
      "Payment rejection failed. The request may have already been reviewed."
    );
  }

  revalidatePath("/platform-admin/live-learning/payments");
  revalidatePath("/platform-admin/live-learning");
  revalidatePath(`/school-dashboard/live-learning/${payment.school_id}`);

  redirect("/platform-admin/live-learning/payments?review=rejected");
}
