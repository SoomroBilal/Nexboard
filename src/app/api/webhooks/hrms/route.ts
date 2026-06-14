import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("X-Webhook-Secret");
    const companyId = request.headers.get("X-Company-Id");
    if (!secret || !companyId) {
      return NextResponse.json({ error: "Missing X-Webhook-Secret or X-Company-Id header" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: company } = await supabase.from("companies").select("settings").eq("id", companyId).single();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const settings = company.settings as Record<string, unknown> | null;
    if (settings?.webhook_secret !== secret) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }

    let body: { email: string; full_name: string; role?: string; title?: string }[];
    try {
      body = await request.json();
      if (!Array.isArray(body)) body = [body];
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const created: { email: string; status: string }[] = [];

    for (const hire of body) {
      if (!hire.email || !hire.full_name) {
        created.push({ email: hire.email || "unknown", status: "skipped: missing fields" });
        continue;
      }

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", hire.email)
        .single();

      if (existing) {
        created.push({ email: hire.email, status: "skipped: already exists" });
        continue;
      }

      const { data: authUser, error: authError } = await supabase.auth.admin.inviteUserByEmail(hire.email, {
        data: {
          full_name: hire.full_name,
          role: hire.role || "new_hire",
          company_id: companyId,
        },
      });

      if (authError || !authUser?.user) {
        created.push({ email: hire.email, status: `failed: ${authError?.message || "unknown"}` });
        continue;
      }

      const { error: taskError } = await supabase.from("tasks").insert({
        company_id: companyId,
        title: `Onboarding: ${hire.title || hire.full_name}`,
        description: `Auto-created from HRMS integration for ${hire.full_name}`,
        assigned_to_user_id: authUser.user.id,
        status: "pending",
      });

      created.push({
        email: hire.email,
        status: taskError ? `created but task failed: ${taskError.message}` : "created",
      });
    }

    return NextResponse.json({ received: body.length, results: created });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
