import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { inviteId } = await request.json();
    if (!inviteId) {
      return NextResponse.json({ error: "inviteId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      .select("id, email, token, company_id, accepted, expires_at")
      .eq("id", inviteId)
      .single();

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.accepted) {
      return NextResponse.json({ error: "Invite already accepted" }, { status: 400 });
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", invite.company_id)
      .single();

    await sendInviteEmail({
      email: invite.email,
      token: invite.token,
      invitedByName: inviter.full_name,
      companyName: company?.name ?? "your team",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resend invite" },
      { status: 500 }
    );
  }
}
