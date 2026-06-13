import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";

export default function LeadershipDashboard() {
  return (
    <DashboardLayout allowedRoles={["leadership"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Executive Dashboard</h1>
          <p className="text-zinc-500">High-level KPIs and strategic insights.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Avg. Onboarding Time", value: "18 days", change: "-12%", icon: BarChart3, color: "text-blue-600" },
            { label: "Employee Readiness", value: "76%", change: "+8%", icon: TrendingUp, color: "text-green-600" },
            { label: "Active Workforce", value: "342", change: "+24", icon: Users, color: "text-purple-600" },
            { label: "Cost per Hire", value: "$2.4k", change: "-18%", icon: DollarSign, color: "text-amber-600" },
          ].map((stat) => {
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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>ROI Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Productivity Gain (per hire)", value: "32%", sub: "+$4,200 avg value" },
                { label: "Time-to-Productivity Reduction", value: "28%", sub: "vs. traditional onboarding" },
                { label: "Retention Improvement", value: "15%", sub: "90-day retention rate" },
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

          <Card>
            <CardHeader>
              <CardTitle>Talent Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { role: "Software Engineering", ready: 24, pipeline: 8 },
                { role: "Data Science", ready: 12, pipeline: 5 },
                { role: "Product Management", ready: 18, pipeline: 3 },
                { role: "Sales & Marketing", ready: 30, pipeline: 10 },
              ].map((item) => (
                <div key={item.role} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.role}</span>
                    <span className="text-zinc-500">{item.ready} ready / {item.pipeline} in pipeline</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-purple-600"
                      style={{ width: `${(item.ready / (item.ready + item.pipeline)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
