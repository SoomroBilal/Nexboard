import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: inviter } = await supabase
      .from("profiles")
      .select("full_name, company_id")
      .eq("id", user.id)
      .single();

    if (!inviter?.company_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: invite } = await supabase
      .from("invites")
      .select("email, company_id")
      .eq("token", token)
      .single();

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", invite.company_id)
      .single();

    await sendInviteEmail({
      email: invite.email,
      token,
      invitedByName: inviter.full_name,
      companyName: company?.name ?? "your team",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send invite" },
      { status: 500 }
    );
  }
}
