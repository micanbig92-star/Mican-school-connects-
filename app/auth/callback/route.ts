
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedSchoolTypes = [
  "Primary",
  "Secondary",
  "Combined",
  "Technical / Vocational",
  "College",
  "University",
  "Other",
];

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validWebsite(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const failureUrl = new URL(
    "/register-school/verification-error",
    url.origin
  );

  const successUrl = new URL(
    "/register-school/complete",
    url.origin
  );

  if (!code) {
    return NextResponse.redirect(failureUrl);
  }

  try {
    const supabase = await createClient();

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(failureUrl);
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    const user = userData.user;

    if (
      userError ||
      !user ||
      !user.email ||
      !user.email_confirmed_at
    ) {
      return NextResponse.redirect(failureUrl);
    }

    const registration =
      user.user_metadata?.school_registration;

    if (
      !registration ||
      typeof registration !== "object" ||
      Array.isArray(registration)
    ) {
      return NextResponse.redirect(failureUrl);
    }

    const schoolName = cleanText(registration.schoolName, 150);
    const schoolType = cleanText(registration.schoolType, 60);
    const country = cleanText(registration.country, 100);
    const state = cleanText(registration.state, 100);
    const city = cleanText(registration.city, 100);
    const address = cleanText(registration.address, 250);
    const schoolEmail = cleanText(
      registration.schoolEmail,
      254
    ).toLowerCase();
    const schoolPhone = cleanText(registration.schoolPhone, 30);
    const website = cleanText(registration.website, 250);
    const registrationNumber = cleanText(
      registration.registrationNumber,
      100
    );
    const adminName = cleanText(registration.adminName, 150);
    const adminEmail = cleanText(
      registration.adminEmail,
      254
    ).toLowerCase();

    if (
      !schoolName ||
      !allowedSchoolTypes.includes(schoolType) ||
      !country ||
      !state ||
      !city ||
      !address ||
      !schoolPhone ||
      !adminName ||
      !validEmail(schoolEmail) ||
      !validEmail(adminEmail) ||
      adminEmail !== user.email.toLowerCase() ||
      !validWebsite(website)
    ) {
      return NextResponse.redirect(failureUrl);
    }

    const admin = createAdminClient();

    const { error: profileError } = await admin
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: adminName,
      });

    if (profileError) {
      console.error(
        "School registration profile error:",
        profileError.message
      );
      return NextResponse.redirect(failureUrl);
    }

    // Check for an earlier completed or partially completed callback.
    const { data: existingSchool, error: lookupError } =
      await admin
        .from("schools")
        .select("id")
        .eq("created_by", user.id)
        .maybeSingle();

    if (lookupError) {
      console.error(
        "School registration lookup error:",
        lookupError.message
      );
      return NextResponse.redirect(failureUrl);
    }

    let schoolId = existingSchool?.id;

    if (!schoolId) {
      const { data: newSchool, error: schoolError } =
        await admin
          .from("schools")
          .insert({
            school_name: schoolName,
            school_type: schoolType,
            country,
            state,
            city,
            address,
            contact_email: schoolEmail,
            contact_phone: schoolPhone,
            website_url: website || null,
            registration_number: registrationNumber || null,
            created_by: user.id,
            status: "pending_review",
          })
          .select("id")
          .single();

      if (schoolError || !newSchool) {
        console.error(
          "School registration insert error:",
          schoolError?.message
        );
        return NextResponse.redirect(failureUrl);
      }

      schoolId = newSchool.id;
    }

    // Assign owner role only on the trusted server.
    // Never accept role or status from browser input.
    const { data: membership, error: membershipLookupError } =
      await admin
        .from("school_memberships")
        .select("id")
        .eq("school_id", schoolId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (membershipLookupError) {
      console.error(
        "School membership lookup error:",
        membershipLookupError.message
      );
      return NextResponse.redirect(failureUrl);
    }

    if (!membership) {
      const { error: membershipError } = await admin
        .from("school_memberships")
        .insert({
          school_id: schoolId,
          user_id: user.id,
          role: "owner",
          status: "pending",
        });

      if (membershipError) {
        console.error(
          "School membership insert error:",
          membershipError.message
        );

        return NextResponse.redirect(failureUrl);
      }
    }

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error(
      "School verification callback failed:",
      error
    );

    return NextResponse.redirect(failureUrl);
  }
}
