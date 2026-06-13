import { NextResponse } from "next/server";

const DEFAULT_TASKS: Record<string, Array<{ title: string; description: string }>> = {
  new_hire: [
    { title: "Complete new hire paperwork", description: "Fill out and submit all required onboarding documents including tax forms, direct deposit, and emergency contact information." },
    { title: "Set up development environment", description: "Install and configure all required software, tools, and access credentials on your work machine." },
    { title: "Review employee handbook", description: "Read through the employee handbook covering company policies, code of conduct, and benefits information." },
    { title: "Schedule introductory meetings", description: "Meet with your manager, team members, and key stakeholders to understand team dynamics and expectations." },
    { title: "Complete security training", description: "Take the mandatory security awareness training covering data protection, password policies, and threat detection." },
  ],
  mentor: [
    { title: "Review mentee onboarding progress", description: "Check in on assigned mentees to review their onboarding checklist completion and address any blockers." },
    { title: "Prepare mentorship plan", description: "Create a structured mentorship plan outlining goals, meeting cadence, and skill development milestones." },
  ],
  hr: [
    { title: "Verify new hire documentation", description: "Review and verify all submitted onboarding documents for completeness and compliance." },
    { title: "Schedule orientation session", description: "Coordinate and schedule the new hire orientation session with relevant departments." },
  ],
};

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
    const { role, count = 5 } = await request.json();

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const apiToken = process.env.HUGGING_FACE_API_TOKEN;
    if (!apiToken) {
      const fallback = (DEFAULT_TASKS[role as string] ?? DEFAULT_TASKS.new_hire).slice(0, count);
      return NextResponse.json({ tasks: fallback });
    }

    const prompt = `Generate ${count} specific onboarding tasks for a ${role} employee. Format each task EXACTLY like this:

Task: [short task title]
Description: [1-2 sentence description]

Generate ${count} tasks following that exact format. Use only plain text.`;

    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/google/flan-t5-xxl",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { max_new_tokens: 500, temperature: 0.7 },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const generatedText = Array.isArray(result)
        ? result.map((r: { generated_text?: string }) => r.generated_text || "").join("\n")
        : result.generated_text || "";

      let tasks = parseGeneratedTasks(generatedText);

      if (tasks.length === 0) {
        tasks = (DEFAULT_TASKS[role as string] ?? DEFAULT_TASKS.new_hire).slice(0, count);
      }

      if (tasks.length > count) {
        tasks = tasks.slice(0, count);
      }

      return NextResponse.json({ tasks });
    } catch {
      const fallback = (DEFAULT_TASKS[role as string] ?? DEFAULT_TASKS.new_hire).slice(0, count);
      return NextResponse.json({ tasks: fallback });
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
