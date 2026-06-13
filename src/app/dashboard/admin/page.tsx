import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, Shield, FileText, Activity, Plus } from "lucide-react";

export default function AdminDashboard() {
  return (
    <DashboardLayout allowedRoles={["company_admin", "super_admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
            <p className="text-zinc-500">Manage users, content, and system configuration.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Users", value: "156", icon: UserCog, color: "text-blue-600" },
            { label: "Active Sessions", value: "23", icon: Activity, color: "text-green-600" },
            { label: "Documents", value: "89", icon: FileText, color: "text-purple-600" },
            { label: "Security Alerts", value: "2", icon: Shield, color: "text-red-600" },
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
              <CardTitle>Recent Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Diana Park", role: "new_hire", date: "2h ago" },
                  { name: "Evan Torres", role: "mentor", date: "5h ago" },
                  { name: "Fiona Liu", role: "new_hire", date: "1d ago" },
                ].map((user) => (
                  <div
                    key={user.name}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-zinc-500">{user.date}</p>
                    </div>
                    <Badge variant={user.role === "mentor" ? "success" : "default"}>
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "API Response Time", status: "Normal", value: "45ms" },
                  { name: "Database", status: "Healthy", value: "99.9%" },
                  { name: "AI Model Queue", status: "Normal", value: "12 req/s" },
                  { name: "Storage", status: "Warning", value: "78% used" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <p className="text-sm">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-500">{item.value}</span>
                      <Badge variant={item.status === "Warning" ? "warning" : "success"}>
                        {item.status}
                      </Badge>
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
