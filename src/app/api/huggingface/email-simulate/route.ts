import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { scenario, userResponse } = await request.json();

    const prompt = `Simulate an email conversation. Context: ${scenario || "client onboarding meeting follow-up"}. The user responded with: "${userResponse}". Generate a realistic reply from the client, including potential objections or concerns.`;

    const apiToken = process.env.HUGGING_FACE_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { error: "Hugging Face API token not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 200, temperature: 0.7 },
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
    return NextResponse.json({ reply: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
