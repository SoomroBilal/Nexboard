import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity, Server, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function ITSecurityDashboard() {
  return (
    <DashboardLayout allowedRoles={["it_security"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">IT & Security Dashboard</h1>
          <p className="text-zinc-500">Monitor system health, security, and compliance.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "System Uptime", value: "99.97%", icon: Server, color: "text-green-600" },
            { label: "Security Incidents", value: "0", icon: Shield, color: "text-blue-600" },
            { label: "Active Alerts", value: "3", icon: AlertTriangle, color: "text-amber-600" },
            { label: "Avg. Response Time", value: "42ms", icon: Activity, color: "text-purple-600" },
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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { event: "Failed Login Attempt", source: "IP: 203.0.113.42", time: "2m ago", severity: "warning" as const },
                { event: "Permission Change", source: "User: admin@co.com", time: "15m ago", severity: "default" as const },
                { event: "API Key Rotation", source: "System auto-rotate", time: "1h ago", severity: "success" as const },
              ].map((item) => (
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
              ))}
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

        {/* Integration Status */}
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
      </div>
    </DashboardLayout>
  );
}
