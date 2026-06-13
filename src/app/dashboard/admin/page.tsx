import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, Shield, FileText, Users, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

async function getAdminData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  const companyId = profile?.company_id;
  if (!companyId) return null;

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  const { count: docCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  const { count: taskCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  const { data: recentProfiles } = await supabase
    .from("profiles")
    .select("full_name, role, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(5);

  return { userCount: userCount ?? 0, docCount: docCount ?? 0, taskCount, recentProfiles: recentProfiles ?? [] };
}

export default async function AdminDashboard() {
  const data = await getAdminData();
  if (!data) return null;

  return (
    <DashboardLayout allowedRoles={["company_admin", "super_admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
            <p className="text-zinc-500">Manage users, content, and system configuration.</p>
          </div>
          <Link href="/admin/users">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Users", value: `${data.userCount}`, icon: UserCog, color: "text-blue-600" },
            { label: "Active Tasks", value: `${data.taskCount}`, icon: Shield, color: "text-green-600" },
            { label: "Documents", value: `${data.docCount}`, icon: FileText, color: "text-purple-600" },
            { label: "Total Users", value: `${data.userCount}`, icon: Users, color: "text-red-600" },
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
              {data.recentProfiles.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">No users registered yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentProfiles.map((p) => (
                    <div
                      key={p.full_name}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <div>
                        <p className="font-medium text-sm">{p.full_name}</p>
                        <p className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={p.role === "mentor" ? "success" : "default"}>
                        {p.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Total Users", status: "Active", value: `${data.userCount}` },
                  { name: "Documents Stored", status: "OK", value: `${data.docCount}` },
                  { name: "Active Tasks", status: "Active", value: `${data.taskCount}` },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <p className="text-sm">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-500">{item.value}</span>
                      <Badge variant="success">{item.status}</Badge>
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
