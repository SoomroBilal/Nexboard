import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { evidence } = await request.json().catch(() => ({ evidence: "" }));

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, assigned_to_user_id, feedback, status")
      .eq("id", id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.assigned_to_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const feedback = (task.feedback as Record<string, unknown> | null) ?? {};
    const timeline = Array.isArray(feedback.timeline)
      ? [...(feedback.timeline as Array<Record<string, unknown>>)]
      : [];

    timeline.push({
      type: "submission",
      by: user.id,
      at: new Date().toISOString(),
      evidence: evidence || null,
      note: "Submitted for mentor review",
    });

    const submissions = Array.isArray(feedback.submissions)
      ? [...(feedback.submissions as Array<Record<string, unknown>>)]
      : [];
    submissions.push({
      at: new Date().toISOString(),
      evidence: evidence || null,
    });

    const nextFeedback = {
      ...feedback,
      submissions,
      timeline,
      latest_evidence: evidence || null,
      submission_count: submissions.length,
    };

    const { data: updated, error: updateError } = await supabase
      .from("tasks")
      .update({
        status: "review",
        feedback: nextFeedback,
      })
      .eq("id", id)
      .select("id, status, feedback")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ task: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
