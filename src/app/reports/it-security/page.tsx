import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Server, Download, CheckCircle, Clock } from "lucide-react";

export default function ITSecurityReportsPage() {
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
            { label: "Security Score", value: "A", change: "Excellent", icon: Shield, color: "text-green-600" },
            { label: "Uptime (30d)", value: "99.97%", change: "No major incidents", icon: Server, color: "text-blue-600" },
            { label: "Open Vulnerabilities", value: "0", change: "All resolved", icon: CheckCircle, color: "text-green-600" },
            { label: "Avg. Response Time", value: "42ms", change: "Within SLA", icon: Clock, color: "text-purple-600" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
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
              <CardTitle>Security Incidents (30 days)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { event: "Failed Authentication Attempts", count: 142, trend: "stable" as const },
                { event: "Suspicious IP Blocks", count: 8, trend: "decreasing" as const },
                { event: "API Rate Limit Exceeded", count: 3, trend: "stable" as const },
                { event: "Data Access Audits", count: 24, trend: "increasing" as const },
              ].map((item) => (
                <div
                  key={item.event}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <span className="text-sm">{item.event}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.count}</span>
                    <Badge
                      variant={
                        item.trend === "increasing" ? "warning" :
                        item.trend === "decreasing" ? "success" : "secondary"
                      }
                    >
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
                { standard: "SOC 2 Type II", status: "Compliant", expiry: "Dec 2026" },
                { standard: "GDPR", status: "Compliant", expiry: "Ongoing" },
                { standard: "CCPA", status: "In Progress", expiry: "Target: Jul 2026" },
                { standard: "ISO 27001", status: "Compliant", expiry: "Mar 2027" },
              ].map((item) => (
                <div
                  key={item.standard}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div>
                    <p className="text-sm font-medium">{item.standard}</p>
                    <p className="text-xs text-zinc-500">Expires: {item.expiry}</p>
                  </div>
                  <Badge variant={item.status === "Compliant" ? "success" : "warning"}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
