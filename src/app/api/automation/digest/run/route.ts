import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CompanyDigest = {
  companyId: string;
  companyName: string;
  totalNewHires: number;
  completedTasks7d: number;
  overdueTasks: number;
  avgReadiness: number;
  recipients: number;
};

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: actor } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("id", user.id)
      .single();

    if (!actor || !["super_admin", "company_admin", "hr"].includes(actor.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const maxCompanies = Number.parseInt(process.env.AUTOMATION_DIGEST_MAX_COMPANIES || "50", 10) || 50;

    let companiesQuery = supabase
      .from("companies")
      .select("id, name")
      .order("created_at", { ascending: false })
      .limit(maxCompanies);

    if (actor.role !== "super_admin") {
      companiesQuery = companiesQuery.eq("id", actor.company_id);
    }

    const { data: companies, error: companiesError } = await companiesQuery;
    if (companiesError) {
      return NextResponse.json({ error: companiesError.message }, { status: 400 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const summaries: CompanyDigest[] = await Promise.all(
      (companies ?? []).map(async (company) => {
        const [
          { count: totalNewHires },
          { count: completedTasks7d },
          { count: overdueTasks },
          { data: readinessRows },
          { count: recipients },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("company_id", company.id)
            .eq("role", "new_hire"),
          supabase
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .eq("company_id", company.id)
            .eq("status", "completed")
            .gte("completion_date", sevenDaysAgo.toISOString()),
          supabase
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .eq("company_id", company.id)
            .lt("due_date", new Date().toISOString())
            .neq("status", "completed"),
          supabase
            .from("performance_metrics")
            .select("score")
            .eq("company_id", company.id)
            .eq("metric_type", "readiness")
            .order("timestamp", { ascending: false })
            .limit(100),
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("company_id", company.id)
            .in("role", ["company_admin", "hr", "mentor"]),
        ]);

        const avgReadiness = readinessRows && readinessRows.length > 0
          ? Math.round(readinessRows.reduce((sum, row) => sum + Number(row.score || 0), 0) / readinessRows.length)
          : 0;

        return {
          companyId: company.id,
          companyName: company.name,
          totalNewHires: totalNewHires ?? 0,
          completedTasks7d: completedTasks7d ?? 0,
          overdueTasks: overdueTasks ?? 0,
          avgReadiness,
          recipients: recipients ?? 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      companyCount: summaries.length,
      summaries,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
