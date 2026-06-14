import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, MessageSquare, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

async function getMentorData() {
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

  const { count: menteeCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("role", "new_hire");

  const { count: pendingReviews } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("assigned_by_user_id", user.id)
    .eq("status", "review");

  const { data: mentees } = await supabase
    .from("profiles")
    .select("id, full_name, profile_data")
    .eq("company_id", companyId)
    .eq("role", "new_hire")
    .limit(10);

  const menteeWithTasks = await Promise.all(
    (mentees ?? []).map(async (mentee) => {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("status")
        .eq("assigned_to_user_id", mentee.id);

      const total = tasks?.length ?? 0;
      const completed = tasks?.filter(t => t.status === "completed").length ?? 0;
      const readiness = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        name: mentee.full_name,
        role: (mentee.profile_data as { role?: string })?.role ?? "New Hire",
        readiness,
        tasks: `${completed}/${total}`,
      };
    })
  );

  const avgReadiness = menteeWithTasks.length > 0
    ? Math.round(menteeWithTasks.reduce((acc, m) => acc + m.readiness, 0) / menteeWithTasks.length)
    : 0;

  return { menteeCount: menteeCount ?? 0, pendingReviews: pendingReviews ?? 0, avgReadiness, menteeWithTasks };
}

export default async function MentorDashboard() {
  const data = await getMentorData();
  if (!data) return null;

  return (
    <DashboardLayout allowedRoles={["mentor"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mentor Dashboard</h1>
          <p className="text-zinc-500">Track your mentees&apos; progress and provide feedback.</p>
          <div className="mt-3">
            <div className="flex gap-2">
              <Link href="/dashboard/mentor/reviews">
                <Button size="sm">Open Review Queue</Button>
              </Link>
              <Link href="/dashboard/mentor/communication">
                <Button size="sm" variant="outline">Open Communication Panel</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active Mentees", value: `${data.menteeCount}`, icon: Users, color: "text-blue-600" },
            { label: "Avg. Readiness", value: `${data.avgReadiness}%`, icon: BarChart3, color: "text-green-600" },
            { label: "Pending Reviews", value: `${data.pendingReviews}`, icon: MessageSquare, color: "text-amber-600" },
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
            {data.menteeWithTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">No mentees assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {data.menteeWithTasks.map((mentee) => (
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
                      <Badge variant={mentee.readiness >= 70 ? "success" : "warning"}>
                        {mentee.readiness}% ready
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
