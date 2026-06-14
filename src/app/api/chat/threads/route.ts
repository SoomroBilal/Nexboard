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

    const { data: threads, error } = await supabase
      .from("chat_threads")
      .select("id, company_id, participant_a_user_id, participant_b_user_id, created_at, updated_at")
      .or(`participant_a_user_id.eq.${user.id},participant_b_user_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ threads: threads ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { peerUserId } = await request.json();
    if (!peerUserId) {
      return NextResponse.json({ error: "peerUserId is required" }, { status: 400 });
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

    const participants = [user.id, peerUserId].sort();
    const [a, b] = participants;

    const { data: existing } = await supabase
      .from("chat_threads")
      .select("id, company_id, participant_a_user_id, participant_b_user_id, created_at, updated_at")
      .eq("company_id", actor.company_id)
      .eq("participant_a_user_id", a)
      .eq("participant_b_user_id", b)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ thread: existing });
    }

    const { data: thread, error } = await supabase
      .from("chat_threads")
      .insert({
        company_id: actor.company_id,
        participant_a_user_id: a,
        participant_b_user_id: b,
        created_by_user_id: user.id,
      })
      .select("id, company_id, participant_a_user_id, participant_b_user_id, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ thread }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
