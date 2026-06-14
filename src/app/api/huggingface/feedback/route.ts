import { NextResponse } from "next/server";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { InferenceClient } from "@huggingface/inference";
import { HUGGING_FACE_MODELS, HUGGING_FACE_TOKEN } from "@/lib/constants";

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

    const apiToken = HUGGING_FACE_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { error: "Hugging Face API token not configured" },
        { status: 500 }
      );
    }

    const client = new InferenceClient(apiToken);
    const completion = await client.chatCompletion({
      model: HUGGING_FACE_MODELS.CHAT,
      messages: [
        {
          role: "system",
          content: "Provide practical, constructive feedback with strengths, improvements, and a readiness score out of 100.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 320,
      temperature: 0.4,
    });

    const generatedText = completion.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ feedback: [{ generated_text: generatedText }] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
