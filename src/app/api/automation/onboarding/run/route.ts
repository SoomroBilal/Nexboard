import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DAY1_TEMPLATES = [
  {
    title: "Day 1: Meet your manager",
    description: "Schedule and complete your manager introduction meeting.",
    dueInDays: 1,
  },
  {
    title: "Day 1: Access setup checklist",
    description: "Verify access to email, core systems, and collaboration tools.",
    dueInDays: 2,
  },
  {
    title: "Day 1: Company policy orientation",
    description: "Review security, compliance, and workplace policies.",
    dueInDays: 3,
  },
];

const DAY7_TEMPLATES = [
  {
    title: "Day 7: Week-one reflection",
    description: "Document key learnings, blockers, and support requests after your first week.",
    dueInDays: 2,
  },
  {
    title: "Day 7: Role readiness checkpoint",
    description: "Complete readiness checkpoint with your mentor/manager.",
    dueInDays: 3,
  },
];

function daysSince(dateStr: string) {
  const created = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

function dueDate(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: actor } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("id", user.id)
      .single();

    if (!actor || !["super_admin", "company_admin", "hr"].includes(actor.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const maxHires = Number.parseInt(process.env.AUTOMATION_ONBOARDING_MAX_HIRES || "300", 10) || 300;
    const maxOverdueTasks = Number.parseInt(process.env.AUTOMATION_ONBOARDING_MAX_OVERDUE || "200", 10) || 200;
    const nowIso = new Date().toISOString();

    let hiresQuery = supabase
      .from("profiles")
      .select("id, company_id, created_at")
      .eq("role", "new_hire")
      .limit(maxHires);

    if (actor.role !== "super_admin") {
      hiresQuery = hiresQuery.eq("company_id", actor.company_id);
    }

    const { data: hires, error: hiresError } = await hiresQuery;
    if (hiresError) {
      return NextResponse.json({ error: hiresError.message }, { status: 400 });
    }

    let createdTasks = 0;
    let nudgedTasks = 0;
    let processedHires = 0;

    for (const hire of hires ?? []) {
      if (!hire.company_id) continue;

      processedHires += 1;
      const dayCount = daysSince(hire.created_at);

      const templates: Array<{ title: string; description: string; dueInDays: number; tag: string }> = [];
      if (dayCount >= 0 && dayCount <= 2) {
        templates.push(...DAY1_TEMPLATES.map((t) => ({ ...t, tag: "day1" })));
      }
      if (dayCount >= 7 && dayCount <= 9) {
        templates.push(...DAY7_TEMPLATES.map((t) => ({ ...t, tag: "day7" })));
      }

      if (templates.length > 0) {
        const titles = templates.map((t) => t.title);
        const { data: existing } = await supabase
          .from("tasks")
          .select("title")
          .eq("assigned_to_user_id", hire.id)
          .in("title", titles);

        const existingTitles = new Set((existing ?? []).map((e) => e.title));
        const inserts = templates
          .filter((t) => !existingTitles.has(t.title))
          .map((t) => ({
            company_id: hire.company_id,
            title: t.title,
            description: t.description,
            assigned_to_user_id: hire.id,
            assigned_by_user_id: actor.id,
            status: "pending",
            due_date: dueDate(t.dueInDays),
            feedback: {
              automation_tag: t.tag,
              generated_by: "automation_onboarding",
              generated_at: new Date().toISOString(),
            },
          }));

        if (inserts.length > 0) {
          const { error: insertErr } = await supabase.from("tasks").insert(inserts);
          if (!insertErr) {
            createdTasks += inserts.length;
          }
        }
      }
    }

    let overdueQuery = supabase
      .from("tasks")
      .select("id, feedback, due_date, status")
      .lt("due_date", nowIso)
      .neq("status", "completed")
      .limit(maxOverdueTasks);

    if (actor.role !== "super_admin") {
      overdueQuery = overdueQuery.eq("company_id", actor.company_id);
    }

    const { data: overdue } = await overdueQuery;

    const nudgeResults = await Promise.all(
      (overdue ?? []).map(async (task) => {
        const feedback = (task.feedback as Record<string, unknown> | null) ?? {};
        const nudgeCount = Number(feedback.nudge_count ?? 0) + 1;
        const merged = {
          ...feedback,
          nudge_count: nudgeCount,
          last_nudged_at: nowIso,
          overdue_days: task.due_date
            ? Math.max(1, Math.floor((Date.now() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24)))
            : 0,
        };

        const { error: updateErr } = await supabase
          .from("tasks")
          .update({ feedback: merged })
          .eq("id", task.id);

        return !updateErr;
      })
    );

    nudgedTasks = nudgeResults.filter(Boolean).length;

    return NextResponse.json({
      success: true,
      processedHires,
      createdTasks,
      nudgedTasks,
      runAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
