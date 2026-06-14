import { NextResponse } from "next/server";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { InferenceClient } from "@huggingface/inference";
import { HUGGING_FACE_MODELS, HUGGING_FACE_TOKEN } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit({ key: buildRateLimitKey(request, "hf:document-analysis") });
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

    const { document, question } = await request.json();

    if (!document) {
      return NextResponse.json({ error: "Document content is required" }, { status: 400 });
    }

    const apiToken = HUGGING_FACE_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { error: "Hugging Face API token not configured" },
        { status: 500 }
      );
    }

    const prompt = `Analyze the following document. Question: ${question || "Summarize this document"}\n\nDocument:\n${document}`;
    const client = new InferenceClient(apiToken);
    const completion = await client.chatCompletion({
      model: HUGGING_FACE_MODELS.CHAT,
      messages: [
        {
          role: "system",
          content: "You are a document analyst. Extract key points, risks, and recommended actions clearly.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 320,
      temperature: 0.3,
    });

    const generatedText = completion.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ analysis: [{ generated_text: generatedText }] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
