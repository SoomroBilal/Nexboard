import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { BarChart3, TrendingUp, Users, Target, LayoutDashboard, LineChart } from "lucide-react";
import Link from "next/link";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "talent", label: "Talent Pipeline", icon: Users },
] as const;

async function getDashboardData() {
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

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", cid);

  const { count: newHires } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", cid)
    .eq("role", "new_hire");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("status")
    .eq("company_id", cid);

  const totalTasks = tasks?.length ?? 0;
  const completedTasks = tasks?.filter((t) => t.status === "completed").length ?? 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const { data: programs } = await supabase
    .from("learning_paths")
    .select("id, name")
    .eq("company_id", cid);

  const { data: metrics } = await supabase
    .from("performance_metrics")
    .select("score")
    .eq("company_id", cid);

  const avgScore = metrics && metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length)
    : 0;

  return { totalUsers: totalUsers ?? 0, newHires: newHires ?? 0, completionRate, programCount: programs?.length ?? 0, avgScore, totalTasks, completedTasks };
}

export default async function LeadershipDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tab } = (await searchParams) as { tab?: string };
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "dashboard";
  const data = await getDashboardData();
  if (!data) return null;

  const stats = [
    { label: "Total Workforce", value: String(data.totalUsers), change: `${data.newHires} new hires`, icon: Users, color: "text-blue-600" },
    { label: "Task Completion", value: `${data.completionRate}%`, change: `${data.completedTasks}/${data.totalTasks} done`, icon: TrendingUp, color: "text-green-600" },
    { label: "Avg Readiness", value: `${data.avgScore}%`, change: "From performance metrics", icon: BarChart3, color: "text-purple-600" },
    { label: "Active Programs", value: String(data.programCount), change: "Onboarding tracks", icon: Target, color: "text-amber-600" },
  ];

  return (
    <DashboardLayout allowedRoles={["leadership"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Executive Dashboard</h1>
          <p className="text-zinc-500">High-level KPIs and strategic insights.</p>
        </div>

        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit dark:bg-zinc-800">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.key}
                href={t.key === "dashboard" ? "/dashboard/leadership" : `/dashboard/leadership?tab=${t.key}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 ${
                  activeTab === t.key
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </Link>
            );
          })}
        </div>

        {(activeTab === "dashboard" || activeTab === "analytics") && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                        <span className="text-sm font-medium text-green-600">{stat.change}</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-zinc-500">{stat.label}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Onboarding Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Task Completion Rate", value: `${data.completionRate}%`, sub: `${data.completedTasks} of ${data.totalTasks} tasks` },
                  { label: "New Hires Onboarded", value: String(data.newHires), sub: "Active new hire accounts" },
                  { label: "Avg Readiness Score", value: `${data.avgScore}%`, sub: "Across all performance metrics" },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <p className="text-sm text-zinc-500">{metric.label}</p>
                    <p className="text-lg font-bold">{metric.value}</p>
                    <p className="text-xs text-zinc-400">{metric.sub}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "talent" && (
          <Card>
            <CardHeader>
              <CardTitle>Workforce Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { role: "All Employees", ready: data.totalUsers, pipeline: 0 },
                { role: "New Hires", ready: data.newHires, pipeline: data.totalUsers - data.newHires },
                { role: "Active Programs", ready: data.programCount, pipeline: 0 },
              ].map((item) => (
                <div key={item.role} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.role}</span>
                    <span className="text-zinc-500">{item.ready} total</span>
                  </div>
                  {item.pipeline > 0 && (
                    <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-2 rounded-full bg-purple-600"
                        style={{ width: `${(item.ready / (item.ready + item.pipeline)) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
