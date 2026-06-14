import { NextResponse } from "next/server";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit({ key: buildRateLimitKey(request, "hf:feedback") });
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

    const { userSubmission, activityType } = await request.json();

    if (!userSubmission) {
      return NextResponse.json({ error: "Submission is required" }, { status: 400 });
    }

    const prompt = `Analyze the following user performance in a ${activityType || "simulation"} activity. Provide constructive feedback on strengths, areas for improvement, and a readiness score (0-100):\n\n${userSubmission}`;

    const apiToken = process.env.HUGGING_FACE_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { error: "Hugging Face API token not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/sshleifer/distilbart-cnn-12-6",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 300, temperature: 0.4 },
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
    return NextResponse.json({ feedback: result });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
