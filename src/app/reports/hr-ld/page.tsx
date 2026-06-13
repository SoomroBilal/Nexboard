import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Download } from "lucide-react";

export default function HRLDReportsPage() {
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
            { label: "Avg. Readiness", value: "71%", change: "+5% vs last quarter" },
            { label: "Completion Rate", value: "84%", change: "+3% vs last quarter" },
            { label: "Avg. Time to Ready", value: "18 days", change: "-2 days vs last quarter" },
            { label: "Compliance Rate", value: "92%", change: "+1% vs last quarter" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-zinc-500">{stat.label}</p>
                <p className="text-xs text-green-600">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Program Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { program: "Engineering Onboarding", cohort: "Q2 2026", enrolled: 12, completed: 10, readiness: "76%" },
                { program: "Data Science Track", cohort: "Q2 2026", enrolled: 8, completed: 5, readiness: "62%" },
                { program: "Product Leadership", cohort: "Q1 2026", enrolled: 6, completed: 6, readiness: "91%" },
              ].map((program) => (
                <div
                  key={program.program}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div>
                    <p className="font-medium">{program.program}</p>
                    <p className="text-xs text-zinc-500">{program.cohort} &middot; {program.enrolled} enrolled</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-500">{program.completed}/{program.enrolled} completed</span>
                    <Badge variant={parseInt(program.readiness) >= 70 ? "success" : "warning"}>
                      {program.readiness} readiness
                    </Badge>
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
