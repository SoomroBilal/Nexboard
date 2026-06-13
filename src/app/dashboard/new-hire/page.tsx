import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Gamepad2, BookOpen, BarChart3, ArrowRight } from "lucide-react";

export default function NewHireDashboard() {
  return (
    <DashboardLayout allowedRoles={["new_hire"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome to Nexboard</h1>
          <p className="text-zinc-500">Your personalized onboarding journey starts here.</p>
        </div>

        {/* Quick stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Tasks Completed", value: "3/12", icon: BookOpen, color: "text-blue-600" },
            { label: "Skill Readiness", value: "45%", icon: BarChart3, color: "text-green-600" },
            { label: "Playground Sessions", value: "2", icon: Gamepad2, color: "text-purple-600" },
            { label: "AI Feedback Score", value: "82", icon: BrainCircuit, color: "text-amber-600" },
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

        {/* Active tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Tasks</CardTitle>
            <Button variant="outline" size="sm" className="gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: "Complete Company Policy Quiz", due: "Tomorrow", status: "in_progress" as const },
                { title: "Code Review Arena: Level 1", due: "In 3 days", status: "pending" as const },
                { title: "Email Simulation: Client Onboarding", due: "Next week", status: "pending" as const },
              ].map((task) => (
                <div
                  key={task.title}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div>
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-zinc-500">Due: {task.due}</p>
                  </div>
                  <Badge variant={task.status === "in_progress" ? "warning" : "secondary"}>
                    {task.status === "in_progress" ? "In Progress" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <Gamepad2 className="h-8 w-8 text-purple-600" />
              <p className="font-semibold">Enter Playground</p>
              <p className="text-xs text-zinc-500">Practice with AI simulations</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <p className="font-semibold">Knowledge Base</p>
              <p className="text-xs text-zinc-500">Search company resources</p>
            </CardContent>
          </Card>
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
