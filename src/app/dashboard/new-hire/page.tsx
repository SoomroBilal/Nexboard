import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Gamepad2, BookOpen, BarChart3, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
    .select("score")
    .eq("user_id", user.id)
    .order("timestamp", { ascending: false })
    .limit(1);

  const aiScore = metrics?.[0]?.score ?? 82;

  const activeTasks = tasks?.filter(t => t.status !== "completed").slice(0, 5) ?? [];

  return { user, profile, tasks, totalTasks, completedTasks, skillReadiness, playgroundCount: playgroundCount ?? 0, aiScore, activeTasks };
}

export default async function NewHireDashboard() {
  const data = await getDashboardData();
  if (!data) return null;

  return (
    <DashboardLayout allowedRoles={["new_hire"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome{data.profile ? `, ${data.profile.full_name}` : ""}</h1>
          <p className="text-zinc-500">Your personalized onboarding journey starts here.</p>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Tasks</CardTitle>
            <Button variant="outline" size="sm" className="gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Button>
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
          <Card className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <BrainCircuit className="h-8 w-8 text-green-600" />
              <p className="font-semibold">AI Assistant</p>
              <p className="text-xs text-zinc-500">Ask anything about onboarding</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
