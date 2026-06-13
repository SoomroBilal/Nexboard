import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { document, question } = await request.json();

    if (!document) {
      return NextResponse.json({ error: "Document content is required" }, { status: 400 });
    }

    const prompt = question
      ? `Based on the following document, answer this question: ${question}\n\nDocument: ${document}`
      : `Summarize the following document:\n\n${document}`;

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
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
