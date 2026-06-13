"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Plus, Search, Pencil, Trash2, Loader, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task, UserRole } from "@/lib/types";

interface UserOption {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
}

interface GeneratedTask {
  title: string;
  description: string;
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formDueDate, setFormDueDate] = useState("");

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTargetUser, setAiTargetUser] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) return;

      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*, profiles!tasks_assigned_to_user_id_fkey(full_name, email)")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (tasksData) setTasks(tasksData as unknown as Task[]);

      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("company_id", profile.company_id)
        .neq("role", "super_admin")
        .order("full_name");

      if (usersData) setUsers(usersData as UserOption[]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    setFormTitle("");
    setFormDescription("");
    setFormAssignee("");
    setFormDueDate("");
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description ?? "");
    setFormAssignee(task.assigned_to_user_id);
    setFormDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
    setError(null);
    setModalOpen(true);
  };

  const refresh = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return;

    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (tasksData) setTasks(tasksData as Task[]);

    const { data: usersData } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("company_id", profile.company_id)
      .neq("role", "super_admin")
      .order("full_name");

    if (usersData) setUsers(usersData as UserOption[]);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formAssignee) return;
    setSaving(true);
    setError(null);

    const payload = {
      title: formTitle,
      description: formDescription,
      assigned_to_user_id: formAssignee,
      due_date: formDueDate ? new Date(formDueDate).toISOString() : null,
    };

    if (editingTask) {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", editingTask.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        setModalOpen(false);
        refresh();
      }
    } else {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to create task");
      } else {
        setModalOpen(false);
        refresh();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) refresh();
  };

  const handleStatusChange = async (id: string, status: Task["status"]) => {
    const supabase = createClient();
    await supabase.from("tasks").update({ status }).eq("id", id);
    refresh();
  };

  const openAiModal = () => {
    setAiTargetUser("");
    setGeneratedTasks([]);
    setSelectedTasks(new Set());
    setAiModalOpen(true);
  };

  const handleGenerate = async () => {
    if (!aiTargetUser) return;
    setGenerating(true);
    setGeneratedTasks([]);

    const targetUser = users.find((u) => u.id === aiTargetUser);
    if (!targetUser) {
      setGenerating(false);
      return;
    }

    try {
      const res = await fetch("/api/huggingface/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetUser.role, count: 5 }),
      });

      const data = await res.json();
      if (data.tasks && Array.isArray(data.tasks)) {
        setGeneratedTasks(data.tasks);
        setSelectedTasks(new Set(data.tasks.map((_: unknown, i: number) => i)));
      }
    } catch {
      // fallback silent
    }
    setGenerating(false);
  };

  const toggleTaskSelection = (index: number) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleCreateSelected = async () => {
    if (selectedTasks.size === 0) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return;

    for (const index of selectedTasks) {
      const task = generatedTasks[index];
      if (!task) continue;

      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          assigned_to_user_id: aiTargetUser,
        }),
      });
    }

    setSaving(false);
    setAiModalOpen(false);
    refresh();
  };

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserName = (id: string) => users.find((u) => u.id === id)?.full_name ?? "Unknown";
  const getUserRole = (id: string) => users.find((u) => u.id === id)?.role;

  return (
    <DashboardLayout allowedRoles={["company_admin", "hr", "mentor", "super_admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Task Management</h1>
            <p className="text-zinc-500">Create and assign onboarding tasks to team members.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={openAiModal}>
              <Sparkles className="h-4 w-4" /> Generate with AI
            </Button>
            <Button className="gap-2" onClick={openCreateModal}>
              <Plus className="h-4 w-4" /> Create Task
            </Button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Search tasks..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-400">
                {searchQuery ? "No tasks match your search." : "No tasks yet. Create one to get started."}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Assigned To</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Due</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((task) => (
                    <tr key={task.id} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.description && <p className="text-xs text-zinc-400 truncate max-w-[200px]">{task.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{getUserName(task.assigned_to_user_id)}</p>
                        <p className="text-xs text-zinc-400">{getUserRole(task.assigned_to_user_id)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                          className="rounded border border-zinc-200 bg-transparent px-2 py-1 text-xs dark:border-zinc-800"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(task)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingTask ? "Edit Task" : "Create Task"}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Complete security training" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Description of the task..." rows={3} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Assign To</label>
            <select
              value={formAssignee}
              onChange={(e) => setFormAssignee(e.target.value)}
              className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm dark:border-zinc-800"
            >
              <option value="">Select a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || !formTitle.trim() || !formAssignee}>
              {saving ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={aiModalOpen} onClose={() => setAiModalOpen(false)} title="Generate Tasks with AI">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Generate tasks for</label>
            <select
              value={aiTargetUser}
              onChange={(e) => setAiTargetUser(e.target.value)}
              className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm dark:border-zinc-800"
            >
              <option value="">Select a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
              ))}
            </select>
          </div>

          <Button onClick={handleGenerate} disabled={generating || !aiTargetUser} className="w-full gap-2">
            {generating ? (
              <>
                <Loader className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate with AI
              </>
            )}
          </Button>

          {generatedTasks.length > 0 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select tasks to create ({selectedTasks.size} of {generatedTasks.length})</label>
                <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                  {generatedTasks.map((task, index) => (
                    <label
                      key={index}
                      className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(index)}
                        onChange={() => toggleTaskSelection(index)}
                        className="mt-1 h-4 w-4 rounded border-zinc-300"
                      />
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-zinc-500">{task.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreateSelected} disabled={saving || selectedTasks.size === 0} className="w-full">
                {saving ? "Creating..." : `Create ${selectedTasks.size} Task${selectedTasks.size > 1 ? "s" : ""}`}
              </Button>
            </>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
