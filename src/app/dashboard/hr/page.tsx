import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, GraduationCap, BarChart3, Users, Plus } from "lucide-react";

export default function HRDashboard() {
  return (
    <DashboardLayout allowedRoles={["hr"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">HR / L&D Dashboard</h1>
            <p className="text-zinc-500">Manage onboarding programs and track workforce readiness.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Program
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active Programs", value: "4", icon: Building2, color: "text-blue-600" },
            { label: "Active New Hires", value: "24", icon: GraduationCap, color: "text-green-600" },
            { label: "Avg. Readiness", value: "71%", icon: BarChart3, color: "text-purple-600" },
            { label: "Mentors Active", value: "12", icon: Users, color: "text-amber-600" },
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
              <CardTitle>Program Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Engineering Onboarding", cohort: "Q2 2026", progress: "65%" },
                  { name: "Data Science Track", cohort: "Q2 2026", progress: "42%" },
                  { name: "Product Leadership", cohort: "Q1 2026", progress: "88%" },
                ].map((program) => (
                  <div
                    key={program.name}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <div>
                      <p className="font-medium text-sm">{program.name}</p>
                      <p className="text-xs text-zinc-500">{program.cohort}</p>
                    </div>
                    <span className="text-sm font-medium">{program.progress}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Security Awareness", completed: "92%" },
                  { name: "Data Privacy (GDPR)", completed: "78%" },
                  { name: "Code of Conduct", completed: "95%" },
                ].map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="font-medium">{item.completed}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-2 rounded-full bg-purple-600"
                        style={{ width: item.completed }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
