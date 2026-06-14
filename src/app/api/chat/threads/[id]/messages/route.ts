import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function loadThread(
  supabase: Awaited<ReturnType<typeof createClient>>,
  threadId: string,
  userId: string
) {
  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id, company_id, participant_a_user_id, participant_b_user_id")
    .eq("id", threadId)
    .single();

  if (!thread) return null;
  if (thread.participant_a_user_id !== userId && thread.participant_b_user_id !== userId) {
    return null;
  }
  return thread;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const thread = await loadThread(supabase, id, user.id);
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("id, sender_user_id, message, created_at")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ messages: messages ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const thread = await loadThread(supabase, id, user.id);
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

    const { data: inserted, error } = await supabase
      .from("chat_messages")
      .insert({
        thread_id: id,
        company_id: thread.company_id,
        sender_user_id: user.id,
        message,
      })
      .select("id, sender_user_id, message, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", id);

    return NextResponse.json({ message: inserted }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
