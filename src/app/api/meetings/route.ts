import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: meetings, error } = await supabase
      .from("meeting_requests")
      .select("id, requester_user_id, recipient_user_id, subject, agenda, preferred_time, status, created_at, updated_at")
      .or(`requester_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ meetings: meetings ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { recipientUserId, subject, agenda, preferredTime } = await request.json();

    if (!recipientUserId || !subject) {
      return NextResponse.json({ error: "recipientUserId and subject are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: requester } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!requester?.company_id) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { data: meeting, error } = await supabase
      .from("meeting_requests")
      .insert({
        company_id: requester.company_id,
        requester_user_id: user.id,
        recipient_user_id: recipientUserId,
        subject,
        agenda: agenda || null,
        preferred_time: preferredTime || null,
        status: "pending",
      })
      .select("id, requester_user_id, recipient_user_id, subject, agenda, preferred_time, status, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ meeting }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
