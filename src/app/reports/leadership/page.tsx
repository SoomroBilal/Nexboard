import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Download } from "lucide-react";

export default function LeadershipReportsPage() {
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
            { label: "Onboarding Cost Savings", value: "$124K", change: "This quarter" },
            { label: "Productivity Gain", value: "+32%", change: "Per new hire" },
            { label: "Time Savings", value: "28%", change: "Reduction in ramp time" },
            { label: "Retention Rate", value: "94%", change: "90-day retention" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-zinc-500">{stat.label}</p>
                <p className="text-xs text-zinc-400">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ROI Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { metric: "Reduced Onboarding Time", before: "25 days", after: "18 days", savings: "28%" },
              { metric: "Mentor Productivity", before: "15 hrs/hire", after: "10 hrs/hire", savings: "33%" },
              { metric: "Early Attrition", before: "12%", after: "6%", savings: "50%" },
            ].map((item) => (
              <div
                key={item.metric}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div>
                  <p className="font-medium">{item.metric}</p>
                  <p className="text-xs text-zinc-500">
                    Before: {item.before} &rarr; After: {item.after}
                  </p>
                </div>
                <Badge variant="success">{item.savings} improvement</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
