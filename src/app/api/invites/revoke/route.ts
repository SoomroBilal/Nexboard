import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: actor } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    const { data: invite } = await supabase
      .from("invites")
      .select("id, company_id")
      .eq("id", inviteId)
      .single();

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (!actor?.company_id || actor.company_id !== invite.company_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("invites").delete().eq("id", inviteId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to revoke invite" },
      { status: 500 }
    );
  }
}
