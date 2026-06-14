"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface ReviewTask {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned_to_user_id: string;
  feedback?: Record<string, unknown> | null;
}

interface UserMini {
  id: string;
  full_name: string;
}

export default function MentorReviewsPage() {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [users, setUsers] = useState<Record<string, UserMini>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [scoreMap, setScoreMap] = useState<Record<string, string>>({});

  const load = async () => {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      setLoading(false);
      return;
    }

    const { data: reviewTasks, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, description, status, assigned_to_user_id, feedback")
      .eq("company_id", profile.company_id)
      .eq("status", "review")
      .order("updated_at", { ascending: false });

    if (taskError) {
      setError(taskError.message);
      setLoading(false);
      return;
    }

    const assigneeIds = Array.from(new Set((reviewTasks ?? []).map((t) => t.assigned_to_user_id).filter(Boolean)));
    if (assigneeIds.length > 0) {
      const { data: userRows } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", assigneeIds);

      const map: Record<string, UserMini> = {};
      (userRows ?? []).forEach((u) => {
        map[u.id] = { id: u.id, full_name: u.full_name };
      });
      setUsers(map);
    }

    setTasks((reviewTasks as ReviewTask[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const submitFeedback = async (taskId: string, markComplete: boolean) => {
    const note = noteMap[taskId] ?? "";
    if (!note.trim()) {
      setError("Feedback note is required.");
      return;
    }

    setSubmittingId(taskId);
    setError(null);
    try {
      const scoreValue = Number(scoreMap[taskId]);
      const res = await fetch(`/api/tasks/${taskId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note,
          score: Number.isFinite(scoreValue) ? scoreValue : undefined,
          markComplete,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to submit feedback");
      else await load();
    } catch {
      setError("Failed to submit feedback");
    }
    setSubmittingId(null);
  };

  return (
    <DashboardLayout allowedRoles={["mentor", "hr", "company_admin", "super_admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mentor Reviews</h1>
          <p className="text-zinc-500">Review submitted tasks and provide structured feedback.</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Card>
          <CardHeader>
            <CardTitle>Tasks Awaiting Review</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-zinc-400">Loading...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-zinc-400">No tasks in review queue.</p>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => {
                  const timeline = Array.isArray(task.feedback?.timeline)
                    ? (task.feedback?.timeline as Array<Record<string, unknown>>)
                    : [];
                  return (
                    <div key={task.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-zinc-500 mt-1">{task.description}</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            Assignee: {users[task.assigned_to_user_id]?.full_name ?? "Unknown"}
                          </p>
                        </div>
                        <Badge variant="warning">{task.status}</Badge>
                      </div>

                      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_120px]">
                        <Textarea
                          placeholder="Write mentor feedback..."
                          value={noteMap[task.id] ?? ""}
                          onChange={(e) => setNoteMap((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        />
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Score"
                          value={scoreMap[task.id] ?? ""}
                          onChange={(e) => setScoreMap((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        />
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => submitFeedback(task.id, false)}
                          disabled={submittingId === task.id}
                        >
                          {submittingId === task.id ? "Saving..." : "Send Feedback"}
                        </Button>
                        <Button
                          onClick={() => submitFeedback(task.id, true)}
                          disabled={submittingId === task.id}
                        >
                          {submittingId === task.id ? "Saving..." : "Approve & Complete"}
                        </Button>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-medium text-zinc-500 mb-2">Timeline</p>
                        {timeline.length === 0 ? (
                          <p className="text-xs text-zinc-400">No timeline yet.</p>
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
