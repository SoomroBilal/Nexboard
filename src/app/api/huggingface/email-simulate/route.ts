import { NextResponse } from "next/server";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { InferenceClient } from "@huggingface/inference";
import { HUGGING_FACE_MODELS, HUGGING_FACE_TOKEN } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit({ key: buildRateLimitKey(request, "hf:email-simulate") });
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

    const { scenario, userResponse } = await request.json();

    const prompt = `Simulate an email conversation. Context: ${scenario || "client onboarding meeting follow-up"}. The user responded with: "${userResponse}". Generate a realistic reply from the client, including potential objections or concerns.`;

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
          content: "You are role-playing a realistic email recipient in a professional business setting.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 260,
      temperature: 0.7,
    });

    const generatedText = completion.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ reply: [{ generated_text: generatedText }] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
