import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { InferenceClient } from "@huggingface/inference";
import { HUGGING_FACE_MODELS, HUGGING_FACE_TOKEN } from "@/lib/constants";

const DEFAULT_TASKS: Record<string, Array<{ title: string; description: string }>> = {
  new_hire: [
    { title: "Complete new hire paperwork", description: "Fill out and submit all required onboarding documents including tax forms, direct deposit, and emergency contact information." },
    { title: "Set up development environment", description: "Install and configure all required software, tools, and access credentials on your work machine." },
    { title: "Review employee handbook", description: "Read through the employee handbook covering company policies, code of conduct, and benefits information." },
    { title: "Schedule introductory meetings", description: "Meet with your manager, team members, and key stakeholders to understand team dynamics and expectations." },
    { title: "Complete security training", description: "Take the mandatory security awareness training covering data protection, password policies, and threat detection." },
    { title: "Set up company email and communication tools", description: "Configure company email, Slack, and any other communication platforms with proper access and notifications." },
    { title: "Review team documentation and project wiki", description: "Read through team-specific documentation including project architecture, coding standards, and workflow guides." },
    { title: "Complete compliance and ethics training", description: "Review company compliance policies, data privacy regulations, and complete the mandatory ethics certification." },
    { title: "Tour office or virtual workspace", description: "Familiarize yourself with the physical office layout or virtual workspace tools used by the team." },
    { title: "Meet with assigned buddy or mentor", description: "Schedule a one-on-one with your assigned buddy or mentor to discuss role expectations and company culture." },
    { title: "Review role-specific training materials", description: "Go through role-specific training modules, videos, and documentation provided by your manager." },
    { title: "Set up payroll and benefits accounts", description: "Register for payroll portals, health benefits, retirement plans, and other employee benefit systems." },
    { title: "Understand team OKRs and goals", description: "Review team and company objectives and key results to understand how your role contributes to broader goals." },
    { title: "Complete first week check-in with manager", description: "Schedule a check-in with your manager at the end of the first week to discuss progress and address questions." },
    { title: "Learn company product and service offerings", description: "Study the company's products or services to understand the value proposition and customer use cases." },
  ],
  mentor: [
    { title: "Review mentee onboarding progress", description: "Check in on assigned mentees to review their onboarding checklist completion and address any blockers." },
    { title: "Prepare mentorship plan", description: "Create a structured mentorship plan outlining goals, meeting cadence, and skill development milestones." },
    { title: "Schedule weekly mentorship sessions", description: "Set up recurring weekly check-ins with your mentees to provide guidance and track progress." },
    { title: "Review mentee work products", description: "Review code reviews, documentation, or other deliverables produced by your mentees and provide constructive feedback." },
    { title: "Create skill development roadmap", description: "Design a personalized skill development roadmap for each mentee based on their role and career aspirations." },
    { title: "Conduct mid-point mentorship review", description: "Evaluate mentee progress at the halfway point, identifying areas of improvement and adjusting the mentorship plan." },
    { title: "Document mentorship best practices", description: "Write down effective mentorship strategies and share with other mentors in the organization." },
    { title: "Facilitate cross-team introductions", description: "Introduce mentees to key stakeholders and team members across departments to build their professional network." },
    { title: "Provide feedback on soft skills", description: "Observe and provide constructive feedback on communication, collaboration, and other soft skills." },
    { title: "Prepare mentee for performance reviews", description: "Guide mentees on how to prepare for performance reviews, including self-assessments and achievement tracking." },
  ],
  hr: [
    { title: "Verify new hire documentation", description: "Review and verify all submitted onboarding documents for completeness and compliance." },
    { title: "Schedule orientation session", description: "Coordinate and schedule the new hire orientation session with relevant departments." },
    { title: "Update employee records in HRIS", description: "Ensure all new hire information is accurately entered into the HR information system." },
    { title: "Prepare onboarding swag and equipment", description: "Coordinate delivery of company swag, laptop, and any necessary equipment before the start date." },
    { title: "Conduct benefits orientation", description: "Explain health insurance, retirement plans, and other benefits to new hires and assist with enrollment." },
    { title: "Update organizational chart", description: "Update the company org chart to reflect new team members and any recent changes in reporting structure." },
    { title: "Send new hire announcement", description: "Draft and distribute a company-wide announcement welcoming new hires with their role and background." },
    { title: "Review and update onboarding checklist", description: "Audit the current onboarding checklist and update any outdated steps or resources." },
    { title: "Collect feedback from recent new hires", description: "Send a feedback survey to recent new hires to identify gaps in the onboarding experience." },
    { title: "Coordinate IT access provisioning", description: "Work with IT to ensure new hires have the appropriate system access, accounts, and permissions." },
    { title: "Plan team building activities", description: "Organize team building events or activities to help new hires integrate with their teams." },
    { title: "Review offboarding checklist for completeness", description: "Ensure the offboarding process is up to date for departing employees, including exit interviews." },
    { title: "Track onboarding completion metrics", description: "Monitor and report on onboarding completion rates and time-to-productivity for new hires." },
    { title: "Update company policy documentation", description: "Review and revise employee handbook and policy documents to reflect current practices and regulations." },
  ],
};

function shufflePick<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function parseGeneratedTasks(text: string): Array<{ title: string; description: string }> {
  const tasks: Array<{ title: string; description: string }> = [];
  const lines = text.split("\n");

  let currentTitle = "";
  let currentDescription = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const titleMatch = trimmed.match(/^(?:\d+[\.\)]\s*)?\*{0,2}(?:Task|Title)?\*{0,2}:\s*(.+)/i);
    if (titleMatch) {
      if (currentTitle) {
        tasks.push({ title: currentTitle, description: currentDescription || currentTitle });
      }
      currentTitle = titleMatch[1].replace(/^["']|["']$/g, "").trim();
      currentDescription = "";
      continue;
    }

    const descMatch = trimmed.match(/^(?:\d+[\.\)]\s*)?\*{0,2}(?:Description|Desc)?\*{0,2}:\s*(.+)/i);
    if (descMatch) {
      currentDescription = descMatch[1].replace(/^["']|["']$/g, "").trim();
      continue;
    }

    if (!trimmed.match(/^(task|title|description|desc)\s*:/i) && !trimmed.match(/^here/) && !trimmed.match(/^sure/) && !trimmed.match(/^below/)) {
      const bullet = trimmed.replace(/^[-*]\s*/, "");
      if (bullet.length > 5) {
        if (currentTitle) {
          currentDescription += (currentDescription ? " " : "") + bullet;
        } else {
          currentTitle = bullet;
        }
      }
    }
  }

  if (currentTitle) {
    tasks.push({ title: currentTitle, description: currentDescription || currentTitle });
  }

  return tasks;
}

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit({ key: buildRateLimitKey(request, "hf:generate-tasks") });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSeconds),
            "X-RateLimit-Limit": String(rate.limit),
            "X-RateLimit-Remaining": String(rate.remaining),
          },
        }
      );
    }

    const {
      role,
      count = 5,
      skillLevel = "beginner",
      programName,
      companyContext,
      persist = false,
      assignToUserId,
    } = await request.json();

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const apiToken = HUGGING_FACE_TOKEN;
    if (!apiToken) {
      const fallback = shufflePick(DEFAULT_TASKS[role as string] ?? DEFAULT_TASKS.new_hire, count);
      return NextResponse.json({ tasks: fallback });
    }

    try {
      const client = new InferenceClient(apiToken);
      const result = await client.chatCompletion({
        model: HUGGING_FACE_MODELS.TASK_GENERATION,
        messages: [
          {
            role: "system",
            content: `You are an onboarding task generator. Generate ${count} specific, actionable onboarding tasks for a ${role} role. Skill level: ${skillLevel}. Program: ${programName || "General Onboarding"}. Company context: ${companyContext || "Standard company onboarding"}.`,
          },
          {
            role: "user",
            content: `Generate ${count} onboarding tasks. Format each task exactly like:

Task: [short title]
Description: [1-2 sentence description]

Generate ${count} tasks in that format. Use only plain text.`,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const generatedText = result.choices?.[0]?.message?.content ?? "";

      let tasks = parseGeneratedTasks(generatedText);

      if (tasks.length === 0) {
        tasks = shufflePick(DEFAULT_TASKS[role as string] ?? DEFAULT_TASKS.new_hire, count);
      }

      if (tasks.length > count) {
        tasks = tasks.slice(0, count);
      }

      if (!persist) {
        return NextResponse.json({ tasks });
      }

      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ tasks, persisted: 0, warning: "Not authenticated" });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) {
        return NextResponse.json({ tasks, persisted: 0, warning: "No company found" });
      }

      const rows = tasks.map((t) => ({
        company_id: profile.company_id,
        title: t.title,
        description: t.description,
        assigned_to_user_id: assignToUserId || null,
        assigned_by_user_id: user.id,
        status: "pending",
      }));

      const { data: inserted, error: insertError } = await supabase
        .from("tasks")
        .insert(rows)
        .select("id, title");

      if (insertError) {
        return NextResponse.json({ tasks, persisted: 0, warning: insertError.message });
      }

      return NextResponse.json({ tasks, persisted: inserted?.length ?? 0, inserted: inserted ?? [] });
    } catch {
      const fallback = shufflePick(DEFAULT_TASKS[role as string] ?? DEFAULT_TASKS.new_hire, count);
      return NextResponse.json({ tasks: fallback });
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
