import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { role, skillLevel, previousTasks } = await request.json();

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const prompt = `Generate a personalized learning task for a ${role} employee at skill level ${skillLevel || "beginner"}. Previous tasks completed: ${previousTasks || "none"}. The task should be challenging but achievable and help develop job-relevant skills.`;

    const apiToken = process.env.HUGGING_FACE_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { error: "Hugging Face API token not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/gpt2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 200, temperature: 0.8 },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Hugging Face API error" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ task: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
