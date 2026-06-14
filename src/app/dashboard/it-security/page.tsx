import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { Shield, Activity, Server, AlertTriangle, CheckCircle, Clock, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "monitoring", label: "Monitoring", icon: Activity },
  { key: "integrations", label: "Integrations", icon: Settings },
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

  const { count: totalTasks } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("company_id", cid);

  const { count: completedTasks } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("company_id", cid)
    .eq("status", "completed");

  const { data: recentTasks } = await supabase
    .from("tasks")
    .select("id, title, status, created_at")
    .eq("company_id", cid)
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: reviewTasks } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("company_id", cid)
    .eq("status", "review");

  const recentEvents = (recentTasks ?? []).map((t) => ({
    event: t.title,
    source: `Task #${t.id}`,
    time: t.created_at
      ? `${Math.max(1, Math.floor((Date.now() - new Date(t.created_at).getTime()) / 60000))}m ago`
      : "N/A",
    severity: t.status === "completed" ? "success" as const : t.status === "review" ? "warning" as const : "default" as const,
  }));

  return { totalUsers: totalUsers ?? 0, newHires: newHires ?? 0, totalTasks: totalTasks ?? 0, completedTasks: completedTasks ?? 0, reviewTasks: reviewTasks ?? 0, recentEvents };
}

export default async function ITSecurityDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tab } = (await searchParams) as { tab?: string };
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "dashboard";
  const data = await getDashboardData();
  if (!data) return null;

  const stats = [
    { label: "Total Users", value: String(data.totalUsers), icon: Server, color: "text-green-600" },
    { label: "New Hires", value: String(data.newHires), icon: Shield, color: "text-blue-600" },
    { label: "Pending Reviews", value: String(data.reviewTasks), icon: AlertTriangle, color: "text-amber-600" },
    { label: "Task Completion", value: data.totalTasks > 0 ? `${Math.round((data.completedTasks / data.totalTasks) * 100)}%` : "N/A", icon: Activity, color: "text-purple-600" },
  ];

  return (
    <DashboardLayout allowedRoles={["it_security"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">IT & Security Dashboard</h1>
          <p className="text-zinc-500">Monitor system health, security, and compliance.</p>
        </div>

        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit dark:bg-zinc-800">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.key}
                href={t.key === "dashboard" ? "/dashboard/it-security" : `/dashboard/it-security?tab=${t.key}`}
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

        {(activeTab === "dashboard" || activeTab === "monitoring") && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-500">{stat.label}</p>
                        <p className="text-xl font-bold">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.recentEvents.length === 0 ? (
                    <p className="py-4 text-center text-sm text-zinc-400">No recent activity.</p>
                  ) : (
                    data.recentEvents.map((item) => (
                      <div
                        key={item.event}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.event}</p>
                          <p className="text-xs text-zinc-500">{item.source} &middot; {item.time}</p>
                        </div>
                        <Badge variant={item.severity}>{item.severity}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { standard: "SOC 2", status: "Compliant", icon: CheckCircle },
                    { standard: "GDPR", status: "Compliant", icon: CheckCircle },
                    { standard: "CCPA", status: "In Review", icon: Clock },
                    { standard: "ISO 27001", status: "Compliant", icon: CheckCircle },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.standard}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">{item.standard}</span>
                        </div>
                        <Badge variant={item.status === "Compliant" ? "success" : "warning"}>
                          {item.status}
                        </Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeTab === "integrations" && (
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { name: "HRMS", status: "Connected", uptime: "99.9%" },
                  { name: "ATS", status: "Connected", uptime: "99.8%" },
                  { name: "Hugging Face API", status: "Connected", uptime: "99.95%" },
                ].map((integration) => (
                  <div
                    key={integration.name}
                    className="rounded-lg border border-zinc-200 p-4 text-center dark:border-zinc-800"
                  >
                    <p className="font-semibold">{integration.name}</p>
                    <Badge variant="success" className="mt-1">{integration.status}</Badge>
                    <p className="mt-1 text-xs text-zinc-500">{integration.uptime} uptime</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
