import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DASHBOARD_ROUTES } from "@/lib/constants";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as keyof typeof DASHBOARD_ROUTES) || "new_hire";
  redirect(DASHBOARD_ROUTES[role]);
}
