
import { NextRequest, NextResponse } from "next/server";
import { requireSchoolManager } from "@/lib/supabase/school-manager";

export const runtime = "nodejs";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const BUCKET = "live-learning-payment-proofs";

type AllowedFile = {
  mime: string;
  extension: string;
};

function json(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function validOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin) {
    try {
      return new URL(origin).origin === request.nextUrl.origin;
    } catch {
      return false;
    }
  }

  return (
    request.headers.get("sec-fetch-site") === "same-origin" &&
    request.headers.get("host") === request.nextUrl.host
  );
}

async function detectFileType(
  file: File
): Promise<AllowedFile | null> {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  const isJpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;

  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";

  const isPdf =
    bytes.length >= 5 &&
    String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";

  if (isJpeg && file.type === "image/jpeg") {
    return { mime: "image/jpeg", extension: "jpg" };
  }

  if (isPng && file.type === "image/png") {
    return { mime: "image/png", extension: "png" };
  }

  if (isWebp && file.type === "image/webp") {
    return { mime: "image/webp", extension: "webp" };
  }

  if (isPdf && file.type === "application/pdf") {
    return { mime: "application/pdf", extension: "pdf" };
  }

  return null;
}

export async function POST(request: NextRequest) {
  if (!validOrigin(request)) {
    return json("Request origin could not be verified.", 403);
  }

  const contentType = request.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return json("Please submit a valid payment form.", 415);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return json("The submitted form could not be read.", 400);
  }

  const schoolId = String(formData.get("schoolId") || "").trim();
  const tutorialId = String(formData.get("tutorialId") || "").trim();
  const paymentReference = String(
    formData.get("paymentReference") || ""
  ).trim();

  const uploadedFile = formData.get("proof");

  if (!UUID.test(schoolId) || !UUID.test(tutorialId)) {
    return json("Invalid school or tutorial.", 400);
  }

  if (
    !paymentReference ||
    paymentReference.length < 3 ||
    paymentReference.length > 120
  ) {
    return json("Enter a valid bank transfer reference.", 400);
  }

  if (!(uploadedFile instanceof File) || uploadedFile.size === 0) {
    return json("Select your payment proof file.", 400);
  }

  if (uploadedFile.size > MAX_FILE_SIZE) {
    return json("The proof file must not exceed 5 MB.", 400);
  }

  const detectedType = await detectFileType(uploadedFile);

  if (!detectedType) {
    return json(
      "Only genuine JPEG, PNG, WebP or PDF files are accepted.",
      400
    );
  }

  let manager;

  try {
    manager = await requireSchoolManager(schoolId);
  } catch {
    return json("Your school administrator session could not be verified.", 403);
  }

  const { admin, user } = manager;

  const [
    { data: school, error: schoolError },
    { data: tutorial, error: tutorialError },
    { data: payment, error: paymentError },
  ] = await Promise.all([
    admin
      .from("schools")
      .select("id, live_learning_payment_exempt")
      .eq("id", schoolId)
      .eq("status", "approved")
      .maybeSingle(),

    admin
      .from("live_tutorials")
      .select("id, status, payment_required")
      .eq("id", tutorialId)
      .eq("status", "published")
      .maybeSingle(),

    admin
      .from("live_tutorial_payment_requests")
      .select("id, status")
      .eq("school_id", schoolId)
      .eq("tutorial_id", tutorialId)
      .maybeSingle(),
  ]);

  if (schoolError || !school) {
    return json("The approved school account could not be verified.", 403);
  }

  if (tutorialError || !tutorial) {
    return json("This published tutorial could not be found.", 404);
  }

  if (!tutorial.payment_required || school.live_learning_payment_exempt) {
    return json("This school does not need to submit payment proof.", 400);
  }

  if (paymentError || !payment) {
    return json("Create the tutorial payment request before submitting proof.", 404);
  }

  if (!["pending", "rejected"].includes(payment.status)) {
    return json(
      "This payment request is not currently accepting proof.",
      409
    );
  }

  const filePath =
    `${schoolId}/${tutorialId}/${crypto.randomUUID()}.${detectedType.extension}`;

  const fileBuffer = new Uint8Array(await uploadedFile.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: detectedType.mime,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Payment proof upload failed:", uploadError.message);
    return json("Unable to securely upload the payment proof.", 500);
  }

  const { error: updateError } = await admin
    .from("live_tutorial_payment_requests")
    .update({
      payment_reference: paymentReference,
      proof_storage_path: filePath,
      status: "submitted",
      reviewed_by: null,
      reviewed_at: null,
      review_note: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .eq("school_id", schoolId)
    .in("status", ["pending", "rejected"]);

  if (updateError) {
    await admin.storage.from(BUCKET).remove([filePath]);

    console.error("Payment request update failed:", updateError.message);
    return json("The proof was uploaded but the request could not be updated. Please try again.", 500);
  }

  return NextResponse.json({
    success: true,
    message:
      "Payment proof submitted. Your school must wait for Super Admin verification.",
    status: "submitted",
  });
}
