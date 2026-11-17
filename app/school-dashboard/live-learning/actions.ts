"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSchoolManager } from "@/lib/supabase/school-manager";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requestLiveTutorialAccess(formData: FormData) {
  const schoolId = String(formData.get("schoolId") || "").trim();
  const tutorialId = String(formData.get("tutorialId") || "").trim();

  if (!UUID.test(schoolId) || !UUID.test(tutorialId)) {
    throw new Error("Invalid school or tutorial.");
  }

  const { admin, user } = await requireSchoolManager(schoolId);

  const [
    { data: school, error: schoolError },
    { data: tutorial, error: tutorialError },
  ] = await Promise.all([
    admin
      .from("schools")
      .select("id, school_name, live_learning_payment_exempt")
      .eq("id", schoolId)
      .eq("status", "approved")
      .maybeSingle(),

    admin
      .from("live_tutorials")
      .select("id, title, status, payment_required, price_amount, price_currency")
      .eq("id", tutorialId)
      .eq("status", "published")
      .maybeSingle(),
  ]);

  if (schoolError || !school) {
    throw new Error("Your approved school account could not be verified.");
  }

  if (tutorialError || !tutorial) {
    throw new Error("This published tutorial could not be found.");
  }

  const isExempt = school.live_learning_payment_exempt === true;
  const paymentRequired = tutorial.payment_required === true;
  const amount = Number(tutorial.price_amount);

  if (paymentRequired && (!Number.isFinite(amount) || amount <= 0)) {
    throw new Error("The tutorial payment amount is not configured.");
  }

  // Free tutorials and exempt schools do not need to submit payment.
  if (!paymentRequired || isExempt) {
    // Record an exemption before activating access.
    if (paymentRequired && isExempt) {
      const { error: waiverError } = await admin
        .from("live_tutorial_payment_requests")
        .upsert(
          {
            tutorial_id: tutorialId,
            school_id: schoolId,
            amount,
            currency: tutorial.price_currency || "NGN",
            payment_method: "bank_transfer",
            payment_reference: null,
            proof_storage_path: null,
            status: "waived",
            reviewed_by: null,
            reviewed_at: new Date().toISOString(),
            review_note: "Automatic school exemption: ST JOSEPH SEMINARY.",
          },
          { onConflict: "tutorial_id,school_id" }
        );

      if (waiverError) {
        console.error("Exemption record failed:", waiverError.message);
        throw new Error("Unable to record the school's payment exemption.");
      }
    }

    const { error: enrolmentError } = await admin
      .from("live_tutorial_school_enrolments")
      .upsert(
        {
          tutorial_id: tutorialId,
          school_id: schoolId,
          status: "participating",
          responded_by: user.id,
          responded_at: new Date().toISOString(),
        },
        { onConflict: "tutorial_id,school_id" }
      );

    if (enrolmentError) {
      console.error("Tutorial enrolment failed:", enrolmentError.message);
      throw new Error("Unable to activate tutorial access.");
    }

    revalidatePath("/school-dashboard");
    revalidatePath(`/school-dashboard/live-learning/${schoolId}`);
    revalidatePath("/student/dashboard");

    redirect(`/school-dashboard/live-learning/${schoolId}?access=active`);
  }

  // Paid schools must create a request. This does not grant tutorial access.
  const { data: existing, error: existingError } = await admin
    .from("live_tutorial_payment_requests")
    .select("id, status")
    .eq("tutorial_id", tutorialId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (existingError) {
    throw new Error("Unable to check your existing payment request.");
  }

  if (
    existing &&
    ["pending", "submitted", "approved", "waived"].includes(existing.status)
  ) {
    throw new Error(
      "Your school already has a payment request or access record for this tutorial."
    );
  }

  const requestData = {
    tutorial_id: tutorialId,
    school_id: schoolId,
    amount,
    currency: tutorial.price_currency || "NGN",
    payment_method: "bank_transfer",
    payment_reference: null,
    proof_storage_path: null,
    status: "pending",
    reviewed_by: null,
    reviewed_at: null,
    review_note: null,
  };

  let requestError;

  if (existing) {
    const result = await admin
      .from("live_tutorial_payment_requests")
      .update(requestData)
      .eq("id", existing.id);

    requestError = result.error;
  } else {
    const result = await admin
      .from("live_tutorial_payment_requests")
      .insert(requestData);

    requestError = result.error;
  }

  if (requestError) {
    console.error("Payment request failed:", requestError.message);
    throw new Error("Unable to create your payment request. Please try again.");
  }

  revalidatePath(`/school-dashboard/live-learning/${schoolId}`);

  redirect(`/school-dashboard/live-learning/${schoolId}?access=requested`);
}