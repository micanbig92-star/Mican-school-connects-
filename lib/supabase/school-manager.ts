import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requireSchoolManager(schoolId: string) {
  if (!UUID.test(schoolId)) redirect("/school-access");

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/sign-in");

  const admin = createAdminClient();

  const { data: membership, error: membershipError } = await admin
    .from("school_memberships")
    .select("role")
    .eq("school_id", schoolId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin"])
    .maybeSingle();

  if (membershipError || !membership) {
    redirect("/school-access");
  }

  const { data: school, error: schoolError } = await admin
    .from("schools")
    .select("id, school_name, status")
    .eq("id", schoolId)
    .eq("status", "approved")
    .maybeSingle();

  if (schoolError || !school) {
    redirect("/school-access");
  }

  return {
    admin,
    user,
    school,
    role: membership.role as "owner" | "admin",
  };
}