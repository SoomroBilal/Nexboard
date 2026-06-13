import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, Building2, Activity, TrendingUp } from "lucide-react";

export default function SuperAdminDashboard() {
  return (
    <DashboardLayout allowedRoles={["super_admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          <p className="text-zinc-500">Manage all companies and platform-wide settings.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Companies", value: "12", icon: Globe, color: "text-blue-600" },
            { label: "Active Users", value: "342", icon: Users, color: "text-green-600" },
            { label: "New This Month", value: "28", icon: TrendingUp, color: "text-purple-600" },
            { label: "Platform Uptime", value: "99.97%", icon: Activity, color: "text-amber-600" },
          ].map((stat) => {
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

        <Card>
          <CardHeader>
            <CardTitle>All Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Acme Inc.", users: 24, plan: "Enterprise", status: "active" as const },
                { name: "TechCorp", users: 56, plan: "Enterprise", status: "active" as const },
                { name: "StartupXYZ", users: 8, plan: "Starter", status: "active" as const },
                { name: "Global Industries", users: 120, plan: "Enterprise", status: "active" as const },
              ].map((company) => (
                <div
                  key={company.name}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="font-medium text-sm">{company.name}</p>
                      <p className="text-xs text-zinc-500">{company.users} users</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{company.plan}</Badge>
                    <Badge variant="success">{company.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
