import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, MessageSquare, ListTodo, LayoutDashboard, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "mentees", label: "My Mentees", icon: Users },
  { key: "tasks", label: "Tasks", icon: ListTodo },
  { key: "feedback", label: "Feedback", icon: MessageSquare },
  { key: "documents", label: "Documents", icon: BookOpen },
] as const;

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

  const { count: totalTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("assigned_by_user_id", user.id);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, created_at")
    .eq("assigned_by_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: mentees } = await supabase
    .from("profiles")
    .select("id, full_name, profile_data")
    .eq("company_id", companyId)
    .eq("role", "new_hire")
    .limit(10);

  const menteeWithTasks = await Promise.all(
    (mentees ?? []).map(async (mentee) => {
      const { data: menteeTasks } = await supabase
        .from("tasks")
        .select("status")
        .eq("assigned_to_user_id", mentee.id);

      const total = menteeTasks?.length ?? 0;
      const completed = menteeTasks?.filter(t => t.status === "completed").length ?? 0;
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

  return { menteeCount: menteeCount ?? 0, pendingReviews: pendingReviews ?? 0, avgReadiness, totalTasks: totalTasks ?? 0, menteeWithTasks, tasks: tasks ?? [] };
}

export default async function MentorDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tab } = (await searchParams) as { tab?: string };
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "dashboard";
  const data = await getMentorData();
  if (!data) return null;

  return (
    <DashboardLayout allowedRoles={["mentor"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mentor Dashboard</h1>
          <p className="text-zinc-500">Track your mentees&apos; progress and provide feedback.</p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg bg-zinc-100 p-1 w-fit dark:bg-zinc-800">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.key}
                href={t.key === "dashboard" ? "/dashboard/mentor" : `/dashboard/mentor?tab=${t.key}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 ${
                  activeTab === t.key
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </Link>
            );
          })}
        </div>

        {activeTab === "dashboard" && (
          <>
            <div className="flex gap-2">
              <Link href="/dashboard/mentor/reviews">
                <Button size="sm">Open Review Queue</Button>
              </Link>
              <Link href="/dashboard/mentor/communication">
                <Button size="sm" variant="outline">Open Communication Panel</Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Active Mentees", value: `${data.menteeCount}`, icon: Users, color: "text-blue-600" },
                { label: "Avg. Readiness", value: `${data.avgReadiness}%`, icon: BarChart3, color: "text-green-600" },
                { label: "Pending Reviews", value: `${data.pendingReviews}`, icon: MessageSquare, color: "text-amber-600" },
                { label: "Total Tasks", value: `${data.totalTasks}`, icon: ListTodo, color: "text-purple-600" },
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
          </>
        )}

        {activeTab === "mentees" && (
          <Card>
            <CardHeader>
              <CardTitle>All Mentees ({data.menteeCount})</CardTitle>
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
        )}

        {activeTab === "tasks" && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Tasks ({data.totalTasks})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.tasks.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">No tasks assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-zinc-500">Created {new Date(task.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={task.status === "completed" ? "success" : task.status === "review" ? "warning" : "secondary"}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "feedback" && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Feedback Reviews ({data.pendingReviews})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.pendingReviews === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">No pending reviews. All caught up!</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-zinc-500">
                    You have {data.pendingReviews} task{data.pendingReviews !== 1 ? "s" : ""} waiting for your review.
                  </p>
                  <Link href="/dashboard/mentor/reviews">
                    <Button>Go to Review Queue</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "documents" && (
          <Card>
            <CardHeader>
              <CardTitle>Documents & Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-500">
                Access shared documents, training materials, and the knowledge base.
              </p>
              <Link href="/knowledge-base">
                <Button variant="outline" className="gap-2"><BookOpen className="h-4 w-4" /> Knowledge Base</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
