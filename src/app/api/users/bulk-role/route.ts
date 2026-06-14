import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

const ALLOWED_ROLES: UserRole[] = [
  "company_admin",
  "hr",
  "mentor",
  "new_hire",
  "leadership",
  "it_security",
];

export async function POST(request: Request) {
  try {
    const { userIds, role } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "userIds is required" }, { status: 400 });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: actor } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!actor?.company_id) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { data: targets } = await supabase
      .from("profiles")
      .select("id")
      .eq("company_id", actor.company_id)
      .in("id", userIds);

    const targetIds = (targets ?? []).map((t) => t.id);
    if (targetIds.length === 0) {
      return NextResponse.json({ error: "No valid users found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .in("id", targetIds)
      .select("id, role");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, updated: data?.length ?? 0, users: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed bulk role update" },
      { status: 500 }
    );
  }
}
