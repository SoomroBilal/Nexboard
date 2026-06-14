import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    if (!status || !["pending", "accepted", "declined", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: meeting } = await supabase
      .from("meeting_requests")
      .select("id, requester_user_id, recipient_user_id")
      .eq("id", id)
      .single();

    if (!meeting) {
      return NextResponse.json({ error: "Meeting request not found" }, { status: 404 });
    }

    if (meeting.requester_user_id !== user.id && meeting.recipient_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from("meeting_requests")
      .update({ status })
      .eq("id", id)
      .select("id, requester_user_id, recipient_user_id, subject, agenda, preferred_time, status, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ meeting: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
