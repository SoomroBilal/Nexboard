import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { InferenceClient } from "@huggingface/inference";
import { HUGGING_FACE_MODELS, HUGGING_FACE_TOKEN } from "@/lib/constants";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { data: docs } = await supabase
      .from("documents")
      .select("id, title, content, access_permissions, updated_at")
      .eq("company_id", profile.company_id)
      .order("updated_at", { ascending: false })
      .limit(30);

    if (!docs || docs.length === 0) {
      return NextResponse.json({
        answer: "No documents found in your company knowledge base.",
        citations: [],
      });
    }

    const apiToken = HUGGING_FACE_TOKEN;
    let queryEmbedding: number[] | null = null;

    if (apiToken) {
      try {
        const client = new InferenceClient(apiToken);
        const emb = await client.featureExtraction({
          model: HUGGING_FACE_MODELS.EMBEDDING,
          inputs: query,
        });
        queryEmbedding = (Array.isArray(emb[0]) ? emb[0] : emb) as number[];
      } catch {
        // fall through
      }
    }

    const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    function keywordSearch() {
      return (docs ?? [])
        .map((doc) => {
          const content = doc.content ?? "";
          const contentLower = content.toLowerCase();
          const titleLower = doc.title.toLowerCase();
          const chunks = (doc.access_permissions as { chunks?: Array<{ content: string }> } | null)?.chunks ?? [];

          let score = 0;
          let excerpt = content.slice(0, 220);

          if (titleLower.includes(query.toLowerCase())) {
            score += 5;
          }

          if (contentLower.includes(query.toLowerCase())) {
            score += 4;
            const idx = contentLower.indexOf(query.toLowerCase());
            excerpt = content.slice(Math.max(0, idx - 60), idx + query.length + 120);
          }

          for (const word of words) {
            if (titleLower.includes(word)) score += 2;
            if (contentLower.includes(word)) score += 1;
          }

          const bestChunkIdx = chunks.findIndex((c) => {
            const cl = c.content.toLowerCase();
            if (cl.includes(query.toLowerCase())) return true;
            return words.some((w) => cl.includes(w));
          });

          if (bestChunkIdx !== -1) {
            score += 2;
            excerpt = chunks[bestChunkIdx].content;
            if (bestChunkIdx > 0) excerpt = chunks[bestChunkIdx - 1].content + "\n" + excerpt;
            if (bestChunkIdx < chunks.length - 1) excerpt = excerpt + "\n" + chunks[bestChunkIdx + 1].content;
          }

          return { id: doc.id, title: doc.title, score, excerpt, updated_at: doc.updated_at };
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
    }

    let citations: Array<{ id: string; title: string; excerpt: string; score: number }> = [];

    if (queryEmbedding) {
      const scored: typeof citations = [];

      for (const doc of docs) {
        const chunks = (doc.access_permissions as { chunks?: Array<{ content: string; embedding?: number[] }> } | null)?.chunks ?? [];

        for (let ci = 0; ci < chunks.length; ci++) {
          const chunk = chunks[ci];
          if (chunk.embedding && Array.isArray(chunk.embedding) && typeof chunk.embedding[0] === "number") {
            const sim = cosineSimilarity(queryEmbedding, chunk.embedding);
            if (sim > 0.3) {
              let excerpt = chunk.content;
              if (ci > 0) excerpt = chunks[ci - 1].content + "\n" + excerpt;
              if (ci < chunks.length - 1) excerpt = excerpt + "\n" + chunks[ci + 1].content;

              scored.push({
                id: doc.id,
                title: doc.title,
                excerpt: excerpt.slice(0, 300),
                score: Math.round(sim * 100),
              });
            }
          }
        }
      }

      scored.sort((a, b) => b.score - a.score);
      if (scored.length > 0) {
        citations = scored.slice(0, 6);
      }
    }

    if (citations.length === 0) {
      citations = keywordSearch() as typeof citations;
    }

    if (citations.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find relevant information about that in your company knowledge base.",
        citations: [],
      });
    }

    const context = citations
      .map((c) => `From "${c.title}":\n${c.excerpt}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are a helpful knowledge base assistant. Answer the user's question based ONLY on the provided context. If the context doesn't contain enough information to answer, say so. Reference specific sources naturally in your answer where relevant.

Context:
${context}

Question: ${query}

Answer based on the context above.`;

    let answer = "I couldn't process that request.";

    if (apiToken) {
      try {
        const client = new InferenceClient(apiToken);
        const response = await client.chatCompletion({
          model: HUGGING_FACE_MODELS.CHAT,
          messages: [
            {
              role: "system",
              content: "You are a company knowledge base assistant. Answer concisely using only the provided context.",
            },
            { role: "user", content: systemPrompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        });
        answer = response.choices?.[0]?.message?.content?.trim() ?? answer;
      } catch {
        answer = "The AI service is temporarily unavailable. Please try again later.";
      }
    } else {
      answer = "AI assistant is not configured. Please set up the Hugging Face API token.";
    }

    return NextResponse.json({
      answer,
      citations: citations.map((c) => ({ id: c.id, title: c.title, excerpt: c.excerpt, score: c.score })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
