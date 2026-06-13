import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BarChart3, MessageSquare, Clock } from "lucide-react";

export default function MentorDashboard() {
  return (
    <DashboardLayout allowedRoles={["mentor"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mentor Dashboard</h1>
          <p className="text-zinc-500">Track your mentees&apos; progress and provide feedback.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active Mentees", value: "5", icon: Users, color: "text-blue-600" },
            { label: "Avg. Readiness", value: "68%", icon: BarChart3, color: "text-green-600" },
            { label: "Pending Reviews", value: "3", icon: MessageSquare, color: "text-amber-600" },
            { label: "Hours This Week", value: "12", icon: Clock, color: "text-purple-600" },
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
            <CardTitle>Mentee Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Alice Chen", role: "Software Engineer", readiness: "72%", tasks: "8/12" },
                { name: "Bob Martinez", role: "Data Analyst", readiness: "55%", tasks: "4/10" },
                { name: "Carol Smith", role: "Product Manager", readiness: "90%", tasks: "11/12" },
              ].map((mentee) => (
                <div
                  key={mentee.name}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div>
                    <p className="font-medium text-sm">{mentee.name}</p>
                    <p className="text-xs text-zinc-500">{mentee.role}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-500">{mentee.tasks} tasks</span>
                    <Badge variant={parseInt(mentee.readiness) >= 70 ? "success" : "warning"}>
                      {mentee.readiness} ready
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
