import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { note, score, markComplete } = await request.json();

    if (!note || typeof note !== "string") {
      return NextResponse.json({ error: "note is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: actor } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!actor || !["mentor", "hr", "company_admin", "super_admin"].includes(actor.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, feedback")
      .eq("id", id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const feedback = (task.feedback as Record<string, unknown> | null) ?? {};
    const timeline = Array.isArray(feedback.timeline)
      ? [...(feedback.timeline as Array<Record<string, unknown>>)]
      : [];
    timeline.push({
      type: "mentor_feedback",
      by: user.id,
      at: new Date().toISOString(),
      note,
      score: typeof score === "number" ? score : null,
    });

    const reviews = Array.isArray(feedback.reviews)
      ? [...(feedback.reviews as Array<Record<string, unknown>>)]
      : [];
    reviews.push({
      at: new Date().toISOString(),
      by: user.id,
      note,
      score: typeof score === "number" ? score : null,
    });

    const nextFeedback = {
      ...feedback,
      reviews,
      timeline,
      latest_review_note: note,
      latest_review_score: typeof score === "number" ? score : null,
    };

    const nextStatus = markComplete ? "completed" : "in_progress";
    const completionDate = markComplete ? new Date().toISOString() : null;

    const { data: updated, error: updateError } = await supabase
      .from("tasks")
      .update({
        status: nextStatus,
        completion_date: completionDate,
        feedback: nextFeedback,
      })
      .eq("id", id)
      .select("id, status, completion_date, feedback")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ task: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
