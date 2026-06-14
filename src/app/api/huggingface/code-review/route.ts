import { NextResponse } from "next/server";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { InferenceClient } from "@huggingface/inference";
import { HUGGING_FACE_MODELS, HUGGING_FACE_TOKEN } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit({ key: buildRateLimitKey(request, "hf:code-review") });
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

    const { code, language } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const prompt = `Review the following ${language || "code"} for bugs, security issues, and best practices. Provide specific feedback and suggestions for improvement:\n\n${code}`;

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
          content: "You are a senior software engineer giving concise code review feedback.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    const generatedText = completion.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ review: [{ generated_text: generatedText }] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
