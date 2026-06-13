import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, model } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiToken = process.env.HUGGING_FACE_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { error: "Hugging Face API token not configured" },
        { status: 500 }
      );
    }

    const modelToUse = model || "google/flan-t5-xxl";

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${modelToUse}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 250, temperature: 0.7 },
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
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
