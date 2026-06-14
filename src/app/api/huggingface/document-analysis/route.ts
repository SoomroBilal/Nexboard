import { NextResponse } from "next/server";
import { buildRateLimitKey, checkRateLimit } from "@/lib/rate-limit";

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

    const apiToken = process.env.HUGGING_FACE_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { error: "Hugging Face API token not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/impira/layoutlm-document-qa",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: { question: question || "Summarize this document", context: document },
          parameters: { max_new_tokens: 300 },
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
    return NextResponse.json({ analysis: result });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
