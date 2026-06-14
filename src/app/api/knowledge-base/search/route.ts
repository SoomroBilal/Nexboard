import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
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

    const { data: docs, error } = await supabase
      .from("documents")
      .select("id, title, content, access_permissions, updated_at")
      .eq("company_id", profile.company_id)
      .order("updated_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const q = query.toLowerCase();
    const results = (docs ?? [])
      .map((doc) => {
        const content = doc.content ?? "";
        const titleScore = doc.title.toLowerCase().includes(q) ? 3 : 0;
        const contentScore = content.toLowerCase().includes(q) ? 2 : 0;
        const chunks = (doc.access_permissions as { chunks?: Array<{ content: string }> } | null)?.chunks ?? [];

        const bestChunk = chunks.find((c) => c.content.toLowerCase().includes(q));
        const score = titleScore + contentScore + (bestChunk ? 1 : 0);

        return {
          id: doc.id,
          title: doc.title,
          score,
          excerpt: bestChunk?.content ?? content.slice(0, 220),
          updated_at: doc.updated_at,
        };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
