import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Gamepad2, BookOpen, BarChart3, ArrowRight, LayoutDashboard, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "learning-paths", label: "Learning Paths", icon: GraduationCap },
  { key: "progress", label: "Progress", icon: BarChart3 },
] as const;

async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_id")
    .eq("id", user.id)
    .single();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("assigned_to_user_id", user.id)
    .order("created_at", { ascending: false });

  const totalTasks = tasks?.length ?? 0;
  const completedTasks = tasks?.filter(t => t.status === "completed").length ?? 0;
  const skillReadiness = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const { count: playgroundCount } = await supabase
    .from("playgrounds")
    .select("*", { count: "exact", head: true })
    .eq("company_id", profile?.company_id ?? "");

  const { data: metrics } = await supabase
    .from("performance_metrics")
    .select("score, timestamp")
    .eq("user_id", user.id)
    .order("timestamp", { ascending: false })
    .limit(6);

  const aiScore = metrics?.[0]?.score ?? 82;
  const trendPoints = (metrics ?? []).slice(0, 4).reverse();
  const readinessTrend = trendPoints.map((m) => Number(m.score));
  const trendDirection = readinessTrend.length >= 2
    ? readinessTrend[readinessTrend.length - 1] - readinessTrend[0]
    : 0;

  const activeTasks = tasks?.filter(t => t.status !== "completed").slice(0, 5) ?? [];
  const nextBestTask = activeTasks[0] ?? null;
  const blockers = activeTasks.filter((t) => {
    if (!t.due_date) return false;
    return new Date(t.due_date).getTime() < Date.now() && t.status !== "completed";
  });

  const { data: learningPaths } = await supabase
    .from("learning_paths")
    .select("id, name, tasks")
    .eq("company_id", profile?.company_id ?? "")
    .limit(5);

  return {
    user,
    profile,
    tasks,
    totalTasks,
    completedTasks,
    skillReadiness,
    playgroundCount: playgroundCount ?? 0,
    aiScore,
    activeTasks,
    nextBestTask,
    blockers,
    readinessTrend,
    trendDirection,
    learningPaths: learningPaths ?? [],
  };
}

export default async function NewHireDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tab } = (await searchParams) as { tab?: string };
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "dashboard";
  const data = await getDashboardData();
  if (!data) return null;

  return (
    <DashboardLayout allowedRoles={["new_hire"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome{data.profile ? `, ${data.profile.full_name}` : ""}</h1>
          <p className="text-zinc-500">Your personalized onboarding journey starts here.</p>
        </div>

        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit dark:bg-zinc-800">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.key}
                href={t.key === "dashboard" ? "/dashboard/new-hire" : `/dashboard/new-hire?tab=${t.key}`}
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
              <Link href="/dashboard/new-hire/tasks">
                <Button size="sm">Open Task Submission Workflow</Button>
              </Link>
              <Link href="/dashboard/new-hire/communication">
                <Button size="sm" variant="outline">Open Communication Panel</Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Tasks Completed", value: `${data.completedTasks}/${data.totalTasks}`, icon: BookOpen, color: "text-blue-600" },
                { label: "Skill Readiness", value: `${data.skillReadiness}%`, icon: BarChart3, color: "text-green-600" },
                { label: "Playground Sessions", value: `${data.playgroundCount}`, icon: Gamepad2, color: "text-purple-600" },
                { label: "AI Feedback Score", value: `${data.aiScore}`, icon: BrainCircuit, color: "text-amber-600" },
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
                <CardTitle>Automation Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                {data.nextBestTask ? (
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium">Next Best Task: {data.nextBestTask.title}</p>
                      <p className="text-xs text-zinc-500">
                        {data.nextBestTask.description || "Generated based on your role and onboarding progress."}
                      </p>
                    </div>
                    <Badge variant="warning">Recommended</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">No recommendation yet. Complete current tasks to get personalized suggestions.</p>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
              <Link href="/playgrounds">
                <Card className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                    <Gamepad2 className="h-8 w-8 text-purple-600" />
                    <p className="font-semibold">Enter Playground</p>
                    <p className="text-xs text-zinc-500">Practice with AI simulations</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/knowledge-base">
                <Card className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                    <p className="font-semibold">Knowledge Base</p>
                    <p className="text-xs text-zinc-500">Search company resources</p>
                  </CardContent>
                </Card>
              </Link>
          <Link href="/knowledge-base">
            <Card className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                <BrainCircuit className="h-8 w-8 text-green-600" />
                <p className="font-semibold">AI Assistant</p>
                <p className="text-xs text-zinc-500">Ask anything about onboarding</p>
              </CardContent>
            </Card>
          </Link>
            </div>
          </>
        )}

        {activeTab === "learning-paths" && (
          <Card>
            <CardHeader>
              <CardTitle>Learning Paths</CardTitle>
            </CardHeader>
            <CardContent>
              {data.learningPaths.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">No learning paths assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.learningPaths.map((lp) => (
                    <div key={lp.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                      <div>
                        <p className="font-medium text-sm">{lp.name}</p>
                        <p className="text-xs text-zinc-500">{lp.tasks?.length ?? 0} tasks</p>
                      </div>
                      <Badge variant="secondary">Program</Badge>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Link href="/admin/programs">
                  <Button variant="outline" size="sm">View All Programs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "progress" && (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Readiness Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.readinessTrend.length === 0 ? (
                    <p className="text-sm text-zinc-400">No trend data yet. Complete assessments to see your progression.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-end gap-1 h-24">
                        {data.readinessTrend.map((point, i) => (
                          <div key={i} className="flex-1 rounded-t bg-purple-500/80" style={{ height: `${Math.max(12, point)}%` }} />
                        ))}
                      </div>
                      <p className="text-sm text-zinc-500">
                        {data.trendDirection >= 0 ? "Improving" : "Needs attention"} trend ({data.trendDirection >= 0 ? "+" : ""}{data.trendDirection} points)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Blockers</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.blockers.length === 0 ? (
                      <p className="text-sm text-zinc-400">No blockers detected. You&apos;re on track.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.blockers.map((task) => (
                        <div key={task.id} className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
                          <p className="text-sm font-medium text-red-700 dark:text-red-300">{task.title}</p>
                          <p className="text-xs text-red-600/80 dark:text-red-300/80">
                            Overdue since {task.due_date ? new Date(task.due_date).toLocaleDateString() : "unknown"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Active Tasks</CardTitle>
                <Link href="/dashboard/new-hire/tasks">
                  <Button variant="outline" size="sm" className="gap-1">
                    View All <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {data.activeTasks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-400">No active tasks. Great job!</p>
                ) : (
                  <div className="space-y-3">
                    {data.activeTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                      >
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-zinc-500">
                            {task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : "No due date"}
                          </p>
                        </div>
                        <Badge variant={task.status === "in_progress" ? "warning" : "secondary"}>
                          {task.status === "in_progress" ? "In Progress" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
