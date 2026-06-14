import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase };
}

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { supabase } = auth;
    const { data: companies, error } = await supabase
      .from("companies")
      .select("id, name, slug, domain, settings, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const enriched = await Promise.all(
      (companies ?? []).map(async (c) => {
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("company_id", c.id);

        const settings = (c.settings as Record<string, unknown> | null) ?? {};
        return {
          ...c,
          userCount: count ?? 0,
          status: (settings.status as string) ?? "active",
          plan: (settings.plan as string) ?? "Starter",
        };
      })
    );

    return NextResponse.json({ companies: enriched });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { supabase } = auth;
    const { name, slug, domain, plan } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }

    const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, "-");

    const { data, error } = await supabase
      .from("companies")
      .insert({
        name,
        slug: cleanSlug,
        domain: domain || null,
        settings: {
          plan: plan || "Starter",
          status: "active",
        },
      })
      .select("id, name, slug, domain, settings, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ company: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
