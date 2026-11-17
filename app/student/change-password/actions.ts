
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function changeStudentPassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password.length < 12 || password.length > 72) {
    return {
      success: false,
      message: "Your new password must be between 12 and 72 characters.",
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      message: "The passwords do not match.",
    };
  }

  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/student/sign-in");
  }

  const userId = userData.user.id;
  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, school_id, must_change_password")
    .eq("auth_user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (studentError || !student) {
    return {
      success: false,
      message: "Your active student account could not be verified.",
    };
  }

  const { data: school, error: schoolError } = await admin
    .from("schools")
    .select("id")
    .eq("id", student.school_id)
    .eq("status", "approved")
    .maybeSingle();

  if (schoolError || !school) {
    return {
      success: false,
      message: "Your school account is not currently approved.",
    };
  }

  if (!student.must_change_password) {
    redirect("/student/dashboard");
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password,
  });

  if (passwordError) {
    return {
      success: false,
      message: "Unable to update your password. Please try again.",
    };
  }

  const { error: updateError } = await admin
    .from("students")
    .update({ must_change_password: false })
    .eq("id", student.id)
    .eq("auth_user_id", userId);

  if (updateError) {
    console.error("Student password status update failed:", updateError.message);

    return {
      success: false,
      message:
        "Your password was changed, but account setup could not be completed. Please submit your new password again.",
    };
  }

  redirect("/student/dashboard");
}
