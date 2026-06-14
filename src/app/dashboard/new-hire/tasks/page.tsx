"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date?: string | null;
  feedback?: Record<string, unknown> | null;
}

export default function NewHireTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [evidenceMap, setEvidenceMap] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, description, status, due_date, feedback")
      .eq("assigned_to_user_id", user.id)
      .order("created_at", { ascending: false });

    if (taskError) setError(taskError.message);
    setTasks((data as TaskItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTasks();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const submitTask = async (taskId: string) => {
    setSubmittingId(taskId);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence: evidenceMap[taskId] || "" }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Submission failed");
      else await loadTasks();
    } catch {
      setError("Submission failed");
    }
    setSubmittingId(null);
  };

  return (
    <DashboardLayout allowedRoles={["new_hire"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Task Submissions</h1>
          <p className="text-zinc-500">Submit your work and track mentor feedback timeline.</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Card>
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-zinc-400">Loading...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-zinc-400">No tasks assigned.</p>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => {
                  const timeline = Array.isArray(task.feedback?.timeline)
                    ? (task.feedback?.timeline as Array<Record<string, unknown>>)
                    : [];
                  return (
                    <div key={task.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-zinc-500 mt-1">{task.description}</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            {task.due_date ? `Due ${new Date(task.due_date).toLocaleDateString()}` : "No due date"}
                          </p>
                        </div>
                        <Badge variant={task.status === "completed" ? "success" : task.status === "review" ? "warning" : "secondary"}>
                          {task.status}
                        </Badge>
                      </div>

                      {task.status !== "completed" && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            placeholder="Add evidence / link / notes for your submission..."
                            value={evidenceMap[task.id] ?? ""}
                            onChange={(e) =>
                              setEvidenceMap((prev) => ({ ...prev, [task.id]: e.target.value }))
                            }
                          />
                          <Button
                            onClick={() => submitTask(task.id)}
                            disabled={submittingId === task.id || task.status === "review"}
                          >
                            {submittingId === task.id
                              ? "Submitting..."
                              : task.status === "review"
                                ? "Awaiting mentor review"
                                : "Submit for Review"}
                          </Button>
                        </div>
                      )}

                      <div className="mt-4">
                        <p className="text-xs font-medium text-zinc-500 mb-2">Feedback Timeline</p>
                        {timeline.length === 0 ? (
                          <p className="text-xs text-zinc-400">No timeline events yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {timeline.slice().reverse().map((entry, idx) => (
                              <div key={idx} className="rounded-md bg-zinc-50 p-2 text-xs dark:bg-zinc-900">
                                <p className="font-medium">{String(entry.type ?? "update")}</p>
                                <p className="text-zinc-500">{entry.note ? String(entry.note) : "No note"}</p>
                                <p className="text-zinc-400">{entry.at ? new Date(String(entry.at)).toLocaleString() : ""}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
