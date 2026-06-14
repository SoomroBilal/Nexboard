"use client";

import { useEffect, useMemo, useState, use } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Globe, Users, Building2, Activity, TrendingUp, Plus, PauseCircle, PlayCircle, Trash2, Pencil, LayoutDashboard, Server, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  userCount: number;
  status: string;
  plan: string;
}

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "companies", label: "Companies", icon: Globe },
  { key: "users", label: "Users", icon: Users },
  { key: "system", label: "System", icon: Server },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SuperAdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tab: initialTab } = use(searchParams);
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.some((t) => t.key === initialTab) ? (initialTab as TabKey) : "dashboard"
  );
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [automationRunning, setAutomationRunning] = useState(false);
  const [automationResult, setAutomationResult] = useState<{
    processedHires: number;
    createdTasks: number;
    nudgedTasks: number;
    runAt: string;
  } | null>(null);
  const [digestRunning, setDigestRunning] = useState(false);
  const [digestResult, setDigestResult] = useState<{
    generatedAt: string;
    companyCount: number;
    summaries: Array<{
      companyId: string;
      companyName: string;
      totalNewHires: number;
      completedTasks7d: number;
      overdueTasks: number;
      avgReadiness: number;
      recipients: number;
    }>;
  } | null>(null);
  const [editingCompany, setEditingCompany] = useState<CompanyRow | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [plan, setPlan] = useState("Starter");

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load companies");
      } else {
        setCompanies(data.companies ?? []);
      }
    } catch {
      setError("Failed to load companies");
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const companyCount = companies.length;
    const userCount = companies.reduce((sum, c) => sum + (c.userCount || 0), 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = companies.filter((c) => new Date(c.created_at) >= startOfMonth).length;
    return { companyCount, userCount, newThisMonth };
  }, [companies]);

  const openCreate = () => {
    setName("");
    setSlug("");
    setDomain("");
    setPlan("Starter");
    setCreateOpen(true);
  };

  const openEdit = (company: CompanyRow) => {
    setEditingCompany(company);
    setName(company.name);
    setSlug(company.slug);
    setDomain(company.domain || "");
    setPlan(company.plan || "Starter");
    setEditOpen(true);
  };

  const createCompany = async () => {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, domain, plan }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to create company");
      else {
        setCreateOpen(false);
        await refresh();
      }
    } catch {
      setError("Failed to create company");
    }
    setSaving(false);
  };

  const updateCompany = async () => {
    if (!editingCompany || !name.trim() || !slug.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${editingCompany.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, domain, plan }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to update company");
      else {
        setEditOpen(false);
        setEditingCompany(null);
        await refresh();
      }
    } catch {
      setError("Failed to update company");
    }
    setSaving(false);
  };

  const setStatus = async (company: CompanyRow, status: "active" | "suspended") => {
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to update status");
      else await refresh();
    } catch {
      setError("Failed to update status");
    }
  };

  const deleteCompany = async (company: CompanyRow) => {
    if (!confirm(`Delete ${company.name}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to delete company");
      else await refresh();
    } catch {
      setError("Failed to delete company");
    }
  };

  const runAutomation = async () => {
    setAutomationRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/automation/onboarding/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to run automation");
      } else {
        setAutomationResult({
          processedHires: data.processedHires,
          createdTasks: data.createdTasks,
          nudgedTasks: data.nudgedTasks,
          runAt: data.runAt,
        });
      }
    } catch {
      setError("Failed to run automation");
    }
    setAutomationRunning(false);
  };

  const runDigest = async () => {
    setDigestRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/automation/digest/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate digest");
      } else {
        setDigestResult({
          generatedAt: data.generatedAt,
          companyCount: data.companyCount,
          summaries: data.summaries,
        });
      }
    } catch {
      setError("Failed to generate digest");
    }
    setDigestRunning(false);
  };

  return (
    <DashboardLayout allowedRoles={["super_admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          <p className="text-zinc-500">Manage all companies and platform-wide settings.</p>
        </div>

        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit dark:bg-zinc-800">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 ${
                  activeTab === t.key
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {activeTab === "dashboard" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Companies", value: `${stats.companyCount}`, icon: Globe, color: "text-blue-600" },
                { label: "Active Users", value: `${stats.userCount}`, icon: Users, color: "text-green-600" },
                { label: "New This Month", value: `${stats.newThisMonth}`, icon: TrendingUp, color: "text-purple-600" },
                { label: "Platform Uptime", value: "99.97%", icon: Activity, color: "text-amber-600" },
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
                <CardTitle>Automation Runner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-zinc-500">
                  Trigger onboarding automation now: day-1/day-7 task assignment and overdue task nudges.
                </p>
                <div className="flex items-center gap-3">
                  <Button onClick={runAutomation} disabled={automationRunning}>
                    {automationRunning ? "Running..." : "Run Automation Now"}
                  </Button>
                  {automationResult && (
                    <p className="text-xs text-zinc-500">
                      Last run: {new Date(automationResult.runAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {automationResult && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                      <p className="text-xs text-zinc-500">New Hires Processed</p>
                      <p className="text-lg font-semibold">{automationResult.processedHires}</p>
                    </div>
                    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                      <p className="text-xs text-zinc-500">Tasks Created</p>
                      <p className="text-lg font-semibold">{automationResult.createdTasks}</p>
                    </div>
                    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                      <p className="text-xs text-zinc-500">Overdue Nudges</p>
                      <p className="text-lg font-semibold">{automationResult.nudgedTasks}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Digest Runner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-zinc-500">
                  Generate mentor/admin progress digests across companies with readiness and overdue summaries.
                </p>
                <div className="flex items-center gap-3">
                  <Button onClick={runDigest} disabled={digestRunning}>
                    {digestRunning ? "Generating..." : "Generate Digest Now"}
                  </Button>
                  {digestResult && (
                    <p className="text-xs text-zinc-500">
                      Last run: {new Date(digestResult.generatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {digestResult && (
                  <div className="space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="text-sm font-medium">{digestResult.companyCount} company summaries generated</p>
                    <div className="space-y-2">
                      {digestResult.summaries.slice(0, 5).map((s) => (
                        <div key={s.companyId} className="rounded-md bg-zinc-50 p-2 text-xs dark:bg-zinc-900">
                          <p className="font-medium text-zinc-700 dark:text-zinc-200">{s.companyName}</p>
                          <p className="text-zinc-500">
                            New hires: {s.totalNewHires} · Completed(7d): {s.completedTasks7d} · Overdue: {s.overdueTasks} · Readiness: {s.avgReadiness}% · Recipients: {s.recipients}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "companies" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">{stats.companyCount} total companies</p>
              <Button className="gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Create Company
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Companies</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="py-8 text-center text-sm text-zinc-400">Loading companies...</p>
                ) : companies.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-400">No companies registered yet.</p>
                ) : (
                  <div className="space-y-3">
                    {companies.map((company) => (
                      <div
                        key={company.id}
                        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-zinc-400" />
                          <div>
                            <p className="font-medium text-sm">{company.name}</p>
                            <p className="text-xs text-zinc-500">{company.userCount} users · {company.slug}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{company.plan}</Badge>
                          <Badge variant={company.status === "active" ? "success" : "warning"}>{company.status}</Badge>
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(company)}>
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                          {company.status === "active" ? (
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => setStatus(company, "suspended")}>
                              <PauseCircle className="h-3 w-3" /> Suspend
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => setStatus(company, "active")}>
                              <PlayCircle className="h-3 w-3" /> Activate
                            </Button>
                          )}
                          <Button variant="destructive" size="sm" className="gap-1" onClick={() => deleteCompany(company)}>
                            <Trash2 className="h-3 w-3" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>Platform Users Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500">Total Users Across All Companies</p>
                  <p className="text-2xl font-bold">{stats.userCount}</p>
                </div>
                <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500">Avg Users Per Company</p>
                  <p className="text-2xl font-bold">
                    {stats.companyCount > 0 ? Math.round(stats.userCount / stats.companyCount) : 0}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/admin/users">
                  <Button variant="outline" className="gap-2">
                    <ArrowUpRight className="h-4 w-4" /> Manage Users
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "system" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation Runner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={runAutomation} disabled={automationRunning}>
                  {automationRunning ? "Running..." : "Run Automation Now"}
                </Button>
                {automationResult && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                      <p className="text-xs text-zinc-500">New Hires Processed</p>
                      <p className="text-lg font-semibold">{automationResult.processedHires}</p>
                    </div>
                    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                      <p className="text-xs text-zinc-500">Tasks Created</p>
                      <p className="text-lg font-semibold">{automationResult.createdTasks}</p>
                    </div>
                    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                      <p className="text-xs text-zinc-500">Overdue Nudges</p>
                      <p className="text-lg font-semibold">{automationResult.nudgedTasks}</p>
                    </div>
                  </div>
                )}
                {automationResult && (
                  <p className="text-xs text-zinc-500">
                    Last run: {new Date(automationResult.runAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Digest Runner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={runDigest} disabled={digestRunning}>
                  {digestRunning ? "Generating..." : "Generate Digest Now"}
                </Button>
                {digestResult && (
                  <div className="space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="text-sm font-medium">{digestResult.companyCount} company summaries generated</p>
                    <div className="space-y-2">
                      {digestResult.summaries.slice(0, 5).map((s) => (
                        <div key={s.companyId} className="rounded-md bg-zinc-50 p-2 text-xs dark:bg-zinc-900">
                          <p className="font-medium text-zinc-700 dark:text-zinc-200">{s.companyName}</p>
                          <p className="text-zinc-500">
                            New hires: {s.totalNewHires} · Completed(7d): {s.completedTasks7d} · Overdue: {s.overdueTasks} · Readiness: {s.avgReadiness}% · Recipients: {s.recipients}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {digestResult && (
                  <p className="text-xs text-zinc-500">
                    Last run: {new Date(digestResult.generatedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Company">
        <div className="space-y-3">
          <Input placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="company-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Input placeholder="company.com (optional)" value={domain} onChange={(e) => setDomain(e.target.value)} />
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
          >
            <option value="Starter">Starter</option>
            <option value="Growth">Growth</option>
            <option value="Enterprise">Enterprise</option>
          </select>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={createCompany} disabled={saving || !name.trim() || !slug.trim()}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Company">
        <div className="space-y-3">
          <Input placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="company-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Input placeholder="company.com (optional)" value={domain} onChange={(e) => setDomain(e.target.value)} />
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
          >
            <option value="Starter">Starter</option>
            <option value="Growth">Growth</option>
            <option value="Enterprise">Enterprise</option>
          </select>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={updateCompany} disabled={saving || !name.trim() || !slug.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
