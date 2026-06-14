import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { InferenceClient } from "@huggingface/inference";
import { HUGGING_FACE_MODELS, HUGGING_FACE_TOKEN } from "@/lib/constants";

interface Chunk {
  content: string;
  index: number;
  start: number;
  end: number;
  embedding?: number[];
}

function splitIntoChunks(text: string, chunkSize = 2500): Chunk[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const slice = normalized.slice(start, end).trim();
    if (slice.length > 0) {
      chunks.push({ content: slice, index, start, end });
      index += 1;
    }
    start = end;
  }

  return chunks;
}

export async function POST(request: Request) {
  try {
    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const allowedRoles = ["company_admin", "super_admin"];
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const chunks = splitIntoChunks(content);

    const apiToken = HUGGING_FACE_TOKEN;
    if (apiToken) {
      const client = new InferenceClient(apiToken);
      for (const chunk of chunks) {
        try {
          const emb = await client.featureExtraction({
            model: HUGGING_FACE_MODELS.EMBEDDING,
            inputs: chunk.content,
          });
          chunk.embedding = (Array.isArray(emb[0]) ? emb[0] : emb) as number[];
        } catch {
          // continue without embedding for this chunk
        }
      }
    }

    const accessPermissions = {
      visibility: "company",
      chunk_count: chunks.length,
      chunks,
      indexed_at: new Date().toISOString(),
    };

    const admin = createAdminClient();
    const { data: doc, error } = await admin
      .from("documents")
      .insert({
        title,
        content,
        company_id: profile.company_id,
        uploaded_by_user_id: user.id,
        access_permissions: accessPermissions,
      })
      .select("id, title, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ document: doc, chunkCount: chunks.length });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
