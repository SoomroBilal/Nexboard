"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Gamepad2, Code, MessageSquare, Bug } from "lucide-react";

const playgrounds = [
  {
    id: "code-review",
    name: "Code Review Arena",
    description: "Analyze code snippets, identify bugs, and suggest improvements with AI guidance.",
    icon: Code,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-950",
    difficulty: "Intermediate",
    tasks: 12,
  },
  {
    id: "email-simulation",
    name: "Email Simulation",
    description: "Practice client communication with realistic AI-generated email scenarios.",
    icon: MessageSquare,
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-950",
    difficulty: "Beginner",
    tasks: 8,
  },
  {
    id: "debugging",
    name: "Debugging Scenarios",
    description: "Debug real-world code issues in a sandboxed environment with AI hints.",
    icon: Bug,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-950",
    difficulty: "Advanced",
    tasks: 6,
  },
];

export default function PlaygroundsPage() {
  return (
    <DashboardLayout allowedRoles={["new_hire", "mentor"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Playgrounds</h1>
            <p className="text-zinc-500">
              Interactive AI-powered simulations to accelerate your skills.
            </p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Search playgrounds..." className="pl-9" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {playgrounds.map((playground) => {
            const Icon = playground.icon;
            return (
              <Card
                key={playground.id}
                className="cursor-pointer transition-all hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex rounded-lg ${playground.bg} p-3`}>
                    <Icon className={`h-6 w-6 ${playground.color}`} />
                  </div>
                  <CardTitle className="text-lg">{playground.name}</CardTitle>
                  <p className="mt-2 text-sm text-zinc-500">{playground.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant="secondary">{playground.difficulty}</Badge>
                    <span className="text-xs text-zinc-400">{playground.tasks} scenarios</span>
                  </div>
                  <Button className="mt-4 w-full gap-2">
                    <Gamepad2 className="h-4 w-4" /> Launch
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
