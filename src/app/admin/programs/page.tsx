"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Plus, Search, Pencil, Trash2, Loader, Sparkles, UserPlus, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LearningPath, Task, UserRole } from "@/lib/types";

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

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<LearningPath[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<LearningPath | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [aiProgramName, setAiProgramName] = useState("");
  const [aiTargetRole, setAiTargetRole] = useState<UserRole>("new_hire");
  const [aiPrompt, setAiPrompt] = useState("");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailProgram, setDetailProgram] = useState<LearningPath | null>(null);
  const [detailTasks, setDetailTasks] = useState<Task[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignProgram, setAssignProgram] = useState<LearningPath | null>(null);
  const [assignTargetUser, setAssignTargetUser] = useState("");
  const [assigning, setAssigning] = useState(false);

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

      const { data: programsData } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (programsData) setPrograms(programsData);

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

    const { data: programsData } = await supabase
      .from("learning_paths")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (programsData) setPrograms(programsData);
  };

  const openCreateModal = () => {
    setEditingProgram(null);
    setFormName("");
    setFormDescription("");
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (program: LearningPath) => {
    setEditingProgram(program);
    setFormName(program.name);
    setFormDescription(program.description ?? "");
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();

    if (editingProgram) {
      const { error: updateError } = await supabase
        .from("learning_paths")
        .update({ name: formName, description: formDescription })
        .eq("id", editingProgram.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        setModalOpen(false);
        refresh();
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) return;

      const { error: insertError } = await supabase
        .from("learning_paths")
        .insert({
          name: formName,
          description: formDescription,
          company_id: profile.company_id,
          tasks: [],
        });

      if (insertError) {
        setError(insertError.message);
      } else {
        setModalOpen(false);
        refresh();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this program and all its template tasks?")) return;
    const supabase = createClient();

    await supabase.from("tasks").delete().eq("playground_id", id);
    const { error } = await supabase.from("learning_paths").delete().eq("id", id);
    if (!error) refresh();
  };

  const openAiModal = () => {
    setAiProgramName("");
    setAiTargetRole("new_hire");
    setAiPrompt("");
    setGeneratedTasks([]);
    setSelectedTasks(new Set());
    setAiModalOpen(true);
  };

  const handleGenerate = async () => {
    if (!aiTargetRole) return;
    setGenerating(true);
    setGeneratedTasks([]);

    try {
      const res = await fetch("/api/huggingface/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: aiTargetRole, count: 5, companyContext: aiPrompt }),
      });

      const data = await res.json();
      if (data.tasks && Array.isArray(data.tasks)) {
        setGeneratedTasks(data.tasks);
        setSelectedTasks(new Set(data.tasks.map((_: unknown, i: number) => i)));
        if (!aiProgramName) {
          setAiProgramName(`${aiTargetRole.replace("_", " ")} Onboarding Program`);
        }
      }
    } catch {
      // silent
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

  const handleCreateProgram = async () => {
    if (selectedTasks.size === 0 || !aiProgramName.trim()) return;
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

    const { data: program, error: programError } = await supabase
      .from("learning_paths")
      .insert({
        name: aiProgramName,
        description: `AI-generated onboarding program for ${aiTargetRole.replace("_", " ")} role.`,
        company_id: profile.company_id,
        tasks: [],
      })
      .select()
      .single();

    if (programError || !program) {
      setError(programError?.message ?? "Failed to create program");
      setSaving(false);
      return;
    }

    const taskIds: string[] = [];
    for (const index of selectedTasks) {
      const task = generatedTasks[index];
      if (!task) continue;

      const { data: newTask } = await supabase
        .from("tasks")
        .insert({
          company_id: profile.company_id,
          title: task.title,
          description: task.description,
          assigned_to_user_id: null,
          assigned_by_user_id: user.id,
          playground_id: program.id,
        })
        .select()
        .single();

      if (newTask) taskIds.push(newTask.id);
    }

    if (taskIds.length > 0) {
      await supabase
        .from("learning_paths")
        .update({ tasks: taskIds })
        .eq("id", program.id);
    }

    setSaving(false);
    setAiModalOpen(false);
    refresh();
  };

  const openDetailModal = async (program: LearningPath) => {
    setDetailProgram(program);
    setDetailLoading(true);
    setDetailModalOpen(true);

    if (program.tasks && program.tasks.length > 0) {
      const supabase = createClient();
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .in("id", program.tasks);

      if (data) setDetailTasks(data);
    } else {
      setDetailTasks([]);
    }
    setDetailLoading(false);
  };

  const openAssignModal = (program: LearningPath) => {
    setAssignProgram(program);
    setAssignTargetUser("");
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (!assignProgram || !assignTargetUser) return;
    setAssigning(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return;

    if (assignProgram.tasks && assignProgram.tasks.length > 0) {
      const { data: templateTasks } = await supabase
        .from("tasks")
        .select("*")
        .in("id", assignProgram.tasks);

      if (templateTasks) {
        for (const template of templateTasks) {
          await supabase.from("tasks").insert({
            company_id: profile.company_id,
            title: template.title,
            description: template.description,
            assigned_to_user_id: assignTargetUser,
            assigned_by_user_id: user.id,
            status: "pending",
            due_date: null,
          });
        }
      }
    }

    setAssigning(false);
    setAssignModalOpen(false);
  };

  const filtered = programs.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout allowedRoles={["company_admin", "hr", "super_admin"]}>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Onboarding Programs</h1>
          <p className="text-zinc-500">Create structured onboarding programs with AI-generated tasks and milestones.</p>
        </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={openAiModal}>
              <Sparkles className="h-4 w-4" /> Generate with AI
            </Button>
            <Button className="gap-2" onClick={openCreateModal}>
              <Plus className="h-4 w-4" /> Create Program
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Automation: generate and persist onboarding tasks</label>
                <p className="text-xs text-zinc-500">
                  Generates role-aware tasks and writes them directly to your company task board.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  setGenerating(true);
                  try {
                    await fetch("/api/huggingface/generate-tasks", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        role: "new_hire",
                        count: 5,
                        skillLevel: "beginner",
                        programName: "General Onboarding",
                        companyContext: "Standard company onboarding checklist",
                        persist: true,
                      }),
                    });
                  } finally {
                    setGenerating(false);
                  }
                }}
                disabled={generating}
                className="gap-2"
              >
                {generating ? <Loader className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Generating..." : "Auto-Generate Tasks"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Search programs..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-400">
                {searchQuery ? "No programs match your search." : "No programs yet. Create one to get started."}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Tasks</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Created</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((program) => (
                    <tr key={program.id} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{program.name}</p>
                        {program.description && (
                          <p className="text-xs text-zinc-400 truncate max-w-[300px]">{program.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {program.tasks?.length ?? 0} tasks
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {new Date(program.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDetailModal(program)} title="View tasks">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openAssignModal(program)} title="Assign to user">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(program)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(program.id)} title="Delete">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProgram ? "Edit Program" : "Create Program"}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Program Name</label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Engineering Onboarding" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Program description..." rows={3} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving ? "Saving..." : editingProgram ? "Update Program" : "Create Program"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={aiModalOpen} onClose={() => setAiModalOpen(false)} title="Generate Program with AI">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Program Name</label>
            <Input value={aiProgramName} onChange={(e) => setAiProgramName(e.target.value)} placeholder="Engineering Onboarding Program" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Role</label>
            <select
              value={aiTargetRole}
              onChange={(e) => setAiTargetRole(e.target.value as UserRole)}
              className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm dark:border-zinc-800"
            >
              <option value="new_hire">New Hire</option>
              <option value="hr">HR</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Prompt (optional)</label>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what kind of tasks to generate, e.g. 'Focus on AWS security training and compliance'"
              rows={3}
            />
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="w-full gap-2">
            {generating ? (
              <><Loader className="h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Tasks</>
            )}
          </Button>

          {generatedTasks.length > 0 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select tasks to include ({selectedTasks.size} of {generatedTasks.length})</label>
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

              <Button onClick={handleCreateProgram} disabled={saving || selectedTasks.size === 0 || !aiProgramName.trim()} className="w-full">
                {saving ? "Creating..." : `Create Program with ${selectedTasks.size} Task${selectedTasks.size > 1 ? "s" : ""}`}
              </Button>
            </>
          )}
        </div>
      </Modal>

      <Modal open={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={detailProgram?.name ?? "Program Tasks"}>
        <div className="space-y-3">
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : detailTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">No tasks in this program.</p>
          ) : (
            detailTasks.map((task, i) => (
              <div key={task.id} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{i + 1}. {task.title}</p>
                    {task.description && <p className="mt-1 text-xs text-zinc-500">{task.description}</p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title={`Assign Program: ${assignProgram?.name ?? ""}`}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            This will copy all {assignProgram?.tasks?.length ?? 0} template tasks to the selected user.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Assign to</label>
            <select
              value={assignTargetUser}
              onChange={(e) => setAssignTargetUser(e.target.value)}
              className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm dark:border-zinc-800"
            >
              <option value="">Select a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
              ))}
            </select>
          </div>
          <Button onClick={handleAssign} disabled={assigning || !assignTargetUser} className="w-full">
            {assigning ? "Assigning..." : `Assign ${assignProgram?.tasks?.length ?? 0} Tasks`}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
