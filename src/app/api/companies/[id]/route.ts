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
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    const { supabase } = auth;
    const { id } = await params;
    const { name, slug, domain, status, plan } = await request.json();

    const { data: existing } = await supabase
      .from("companies")
      .select("settings")
      .eq("id", id)
      .single();

    const existingSettings = (existing?.settings as Record<string, unknown> | null) ?? {};
    const nextSettings = {
      ...existingSettings,
      ...(status ? { status } : {}),
      ...(plan ? { plan } : {}),
    };

    const { data, error } = await supabase
      .from("companies")
      .update({
        ...(name ? { name } : {}),
        ...(slug ? { slug: String(slug).toLowerCase().replace(/[^a-z0-9-]/g, "-") } : {}),
        ...(domain !== undefined ? { domain: domain || null } : {}),
        settings: nextSettings,
      })
      .eq("id", id)
      .select("id, name, slug, domain, settings, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ company: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    const { supabase } = auth;
    const { id } = await params;

    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
