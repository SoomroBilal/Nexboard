import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Chunk {
  content: string;
  index: number;
  start: number;
  end: number;
}

function splitIntoChunks(text: string, chunkSize = 700): Chunk[] {
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
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const chunks = splitIntoChunks(content);

    const accessPermissions = {
      visibility: "company",
      chunk_count: chunks.length,
      chunks,
      indexed_at: new Date().toISOString(),
    };

    const { data: doc, error } = await supabase
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
