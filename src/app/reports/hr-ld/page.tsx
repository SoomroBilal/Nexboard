import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { BarChart3, Download, GraduationCap, Users, CheckCircle, Clock } from "lucide-react";

async function getReportData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!profile?.company_id) return null;
  const cid = profile.company_id;

  const { data: allTasks } = await supabase
    .from("tasks")
    .select("id, status, created_at, completion_date, playground_id")
    .eq("company_id", cid);

  const total = allTasks?.length ?? 0;
  const completed = allTasks?.filter((t) => t.status === "completed").length ?? 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const { data: metrics } = await supabase
    .from("performance_metrics")
    .select("score")
    .eq("company_id", cid);

  const avgScore = metrics && metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length)
    : 0;

  const completedDates = allTasks
    ?.filter((t) => t.status === "completed" && t.completion_date)
    .map((t) => ({ created: new Date(t.created_at).getTime(), completed: new Date(t.completion_date!).getTime() }));
  const avgDays = completedDates && completedDates.length > 0
    ? Math.round(completedDates.reduce((s, d) => s + (d.completed - d.created) / 86400000, 0) / completedDates.length)
    : 0;

  const { data: programs } = await supabase
    .from("learning_paths")
    .select("id, name, tasks")
    .eq("company_id", cid);

  const programStats = await Promise.all(
    (programs ?? []).map(async (p) => {
      const taskIds = (p.tasks as string[]) ?? [];
      if (taskIds.length === 0) return { name: p.name, enrolled: 0, completedCount: 0, total: 0, readiness: "0%" };
      const { data: ptasks } = await supabase
        .from("tasks")
        .select("status")
        .in("id", taskIds);
      const t = ptasks?.length ?? 0;
      const c = ptasks?.filter((t) => t.status === "completed").length ?? 0;
      const r = t > 0 ? Math.round((c / t) * 100) : 0;
      return { name: p.name, enrolled: t, completedCount: c, total: t, readiness: `${r}%` };
    })
  );

  return { total, completed, completionRate, avgScore, avgDays, programStats };
}

export default async function HRLDReportsPage() {
  const data = await getReportData();
  if (!data) return null;

  return (
    <DashboardLayout allowedRoles={["hr", "company_admin", "super_admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">HR / L&D Reports</h1>
            <p className="text-zinc-500">Program effectiveness, readiness, and compliance analytics.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Avg. Readiness", value: `${data.avgScore}%`, icon: BarChart3, color: "text-purple-600", change: "From performance metrics" },
            { label: "Completion Rate", value: `${data.completionRate}%`, icon: CheckCircle, color: "text-green-600", change: `${data.completed}/${data.total} tasks` },
            { label: "Avg. Time to Complete", value: `${data.avgDays} days`, icon: Clock, color: "text-amber-600", change: "Per task" },
            { label: "Active Programs", value: String(data.programStats.length), icon: GraduationCap, color: "text-blue-600", change: "Learning paths" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-zinc-500">{stat.label}</p>
                  <p className="text-xs text-green-600">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Program Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {data.programStats.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">No programs created yet.</p>
            ) : (
              <div className="space-y-4">
                {data.programStats.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-zinc-500">{p.total > 0 ? `${p.enrolled} tasks` : "No tasks"}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-zinc-500">{p.completedCount}/{p.total} completed</span>
                      <Badge variant={parseInt(p.readiness) >= 70 ? "success" : "warning"}>
                        {p.readiness} completion
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
