import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { Download, BarChart3, Users, Clock, Target } from "lucide-react";

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
    .select("status, created_at, completion_date, assigned_to_user_id")
    .eq("company_id", cid);

  const total = allTasks?.length ?? 0;
  const completed = allTasks?.filter((t) => t.status === "completed").length ?? 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const { count: newHireCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", cid)
    .eq("role", "new_hire");

  const { data: metrics } = await supabase
    .from("performance_metrics")
    .select("score, user_id")
    .eq("company_id", cid);

  const avgScore = metrics && metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length)
    : 0;

  const uniqueUsersWithTasks = new Set(allTasks?.map((t) => t.assigned_to_user_id).filter(Boolean)).size;

  const completedDates = allTasks
    ?.filter((t) => t.status === "completed" && t.completion_date)
    .map((t) => ({ created: new Date(t.created_at).getTime(), completed: new Date(t.completion_date!).getTime() }));

  const avgDays = completedDates && completedDates.length > 0
    ? Math.round(completedDates.reduce((s, d) => s + (d.completed - d.created) / 86400000, 0) / completedDates.length)
    : 0;

  return { total, completed, completionRate, newHireCount: newHireCount ?? 0, avgScore, uniqueUsersWithTasks, avgDays };
}

export default async function LeadershipReportsPage() {
  const data = await getReportData();
  if (!data) return null;

  return (
    <DashboardLayout allowedRoles={["leadership", "company_admin", "super_admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Leadership Reports</h1>
            <p className="text-zinc-500">Executive KPIs, ROI, and strategic workforce insights.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active New Hires", value: String(data.newHireCount), icon: Users, color: "text-blue-600", change: "Currently onboarded" },
            { label: "Task Completion", value: `${data.completionRate}%`, icon: Target, color: "text-green-600", change: `${data.completed}/${data.total} tasks done` },
            { label: "Avg Readiness Score", value: `${data.avgScore}%`, icon: BarChart3, color: "text-purple-600", change: "From performance metrics" },
            { label: "Avg Time to Complete", value: `${data.avgDays} days`, icon: Clock, color: "text-amber-600", change: "Per task" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-zinc-500">{stat.label}</p>
                  <p className="text-xs text-zinc-400">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Onboarding ROI Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { metric: "Active New Hires", before: "N/A", after: String(data.newHireCount), savings: `${data.newHireCount} total` },
              { metric: "Task Completion Rate", before: "N/A", after: `${data.completionRate}%`, savings: `${data.completed} of ${data.total} completed` },
              { metric: "Avg Readiness Score", before: "N/A", after: `${data.avgScore}%`, savings: `${data.uniqueUsersWithTasks} users with scores` },
            ].map((item) => (
              <div
                key={item.metric}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div>
                  <p className="font-medium">{item.metric}</p>
                  <p className="text-xs text-zinc-500">{item.after}</p>
                </div>
                <Badge variant="success">{item.savings}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
