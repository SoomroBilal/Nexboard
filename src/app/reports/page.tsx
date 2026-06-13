import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <DashboardLayout allowedRoles={["hr", "leadership", "company_admin", "super_admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-zinc-500">Centralized analytics and reporting hub.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <Users className="h-10 w-10 text-blue-600" />
              <CardTitle className="text-base">HR / L&D Reports</CardTitle>
              <p className="text-xs text-zinc-500">
                Program effectiveness, readiness scores, compliance tracking
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                View Reports
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <TrendingUp className="h-10 w-10 text-purple-600" />
              <CardTitle className="text-base">Leadership Reports</CardTitle>
              <p className="text-xs text-zinc-500">
                Executive KPIs, ROI metrics, talent pipeline insights
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                View Reports
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <BarChart3 className="h-10 w-10 text-green-600" />
              <CardTitle className="text-base">IT / Security Reports</CardTitle>
              <p className="text-xs text-zinc-500">
                System health, security incidents, compliance status
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
