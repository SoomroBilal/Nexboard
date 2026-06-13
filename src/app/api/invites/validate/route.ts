import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("invites")
    .select("company_id, role, email, accepted, expires_at")
    .eq("token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  if (data.accepted) {
    return NextResponse.json({ error: "This invite has already been accepted" }, { status: 400 });
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 400 });
  }

  return NextResponse.json({
    company_id: data.company_id,
    role: data.role,
    email: data.email,
  });
}
