import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { Shield, Server, Download, Users, Clock, AlertTriangle } from "lucide-react";

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

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", cid);

  const { count: adminUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", cid)
    .in("role", ["company_admin", "super_admin"]);

  const { count: activeHires } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", cid)
    .eq("role", "new_hire");

  const { data: latestMetrics } = await supabase
    .from("performance_metrics")
    .select("score, created_at")
    .eq("company_id", cid)
    .order("created_at", { ascending: false })
    .limit(1);

  const recentAvg = latestMetrics && latestMetrics.length > 0 ? latestMetrics[0].score : 0;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const { count: recentScores } = await supabase
    .from("performance_metrics")
    .select("id", { count: "exact", head: true })
    .eq("company_id", cid)
    .gte("created_at", thirtyDaysAgo);

  return {
    totalUsers: totalUsers ?? 0,
    adminUsers: adminUsers ?? 0,
    activeHires: activeHires ?? 0,
    recentAvg,
    recentScores: recentScores ?? 0,
  };
}

export default async function ITSecurityReportsPage() {
  const data = await getReportData();
  if (!data) return null;

  return (
    <DashboardLayout allowedRoles={["it_security", "company_admin", "super_admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">IT / Security Reports</h1>
            <p className="text-zinc-500">System health, security posture, and compliance status.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Users", value: String(data.totalUsers), icon: Users, color: "text-blue-600", change: "All roles" },
            { label: "Admin Accounts", value: String(data.adminUsers), icon: Shield, color: "text-amber-600", change: "Privileged access" },
            { label: "Active New Hires", value: String(data.activeHires), icon: AlertTriangle, color: "text-purple-600", change: "Currently onboarded" },
            { label: "Metrics (30d)", value: String(data.recentScores), icon: Clock, color: "text-green-600", change: "Recent evaluations" },
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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>System Health (30 days)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { event: "Total Users", count: data.totalUsers, trend: "active" as const },
                { event: "Admin Accounts", count: data.adminUsers, trend: "active" as const },
                { event: "Active New Hires", count: data.activeHires, trend: "active" as const },
                { event: "Recent Metric Entries", count: data.recentScores, trend: data.recentScores > 0 ? "active" as const : "warning" as const },
              ].map((item) => (
                <div
                  key={item.event}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <span className="text-sm">{item.event}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.count}</span>
                    <Badge variant={item.trend === "active" ? "success" : "warning"}>
                      {item.trend}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { standard: "User Access Control", status: "Active", expiry: `${data.totalUsers} users managed` },
                { standard: "Role-Based Access", status: "Active", expiry: `${data.adminUsers} admin accounts` },
                { standard: "Data Isolation", status: "Per-Company", expiry: "Multi-tenant enabled" },
              ].map((item) => (
                <div
                  key={item.standard}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div>
                    <p className="text-sm font-medium">{item.standard}</p>
                    <p className="text-xs text-zinc-500">{item.expiry}</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
