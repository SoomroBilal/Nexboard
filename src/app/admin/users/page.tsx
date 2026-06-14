"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Search, MoreHorizontal, Mail, UserPlus, Shield, Pencil, Link, Copy, Check, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Invite, UserRole } from "@/lib/types";

const roleOptions = [
  { value: "company_admin" as UserRole, label: "Company Admin", desc: "Full access to manage company and users" },
  { value: "hr" as UserRole, label: "HR / L&D", desc: "Manage programs, reports, and new hires" },
  { value: "mentor" as UserRole, label: "Mentor", desc: "Assign tasks and review mentee progress" },
  { value: "new_hire" as UserRole, label: "New Hire", desc: "Access learning paths and playgrounds" },
  { value: "leadership" as UserRole, label: "Leadership", desc: "View executive dashboards and reports" },
  { value: "it_security" as UserRole, label: "IT / Security", desc: "Monitor security and integrations" },
];

function getInviteLink(token: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  return `${base}/auth/signup?invite=${token}`;
}

export default function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tab: initialTab } = use(searchParams);
  const [tab, setTab] = useState<"users" | "invites">(
    initialTab === "invites" ? "invites" : "users"
  );
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("new_hire");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("new_hire");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteStep, setInviteStep] = useState<"form" | "done">("form");
  const [lastInviteToken, setLastInviteToken] = useState<string | null>(null);
  const [lastInviteEmail, setLastInviteEmail] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<UserRole>("new_hire");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [inviteActionLoadingId, setInviteActionLoadingId] = useState<string | null>(null);

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

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (profilesData) setProfiles(profilesData);

      const { data: invitesData } = await supabase
        .from("invites")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false });

      if (invitesData) setInvites(invitesData as Invite[]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const refreshData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return;

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (profilesData) setProfiles(profilesData);

    const { data: invitesData } = await supabase
      .from("invites")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (invitesData) setInvites(invitesData as Invite[]);
  };

  const handleInvite = async (sendEmail = true) => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return;

    const token = crypto.randomUUID();

    const { error: inviteError } = await supabase.from("invites").insert({
      company_id: profile.company_id,
      email: inviteEmail,
      role: inviteRole,
      invited_by_user_id: user.id,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (inviteError) {
      setError(inviteError.message);
      setInviteLoading(false);
      return;
    }

    if (sendEmail) {
      const res = await fetch("/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(`Invite created but email failed: ${err.error}`);
      }
    }

    setLastInviteToken(token);
    setLastInviteEmail(inviteEmail);
    setInviteStep("done");
    setInviteLoading(false);
    await refreshData();
  };

  const handleSendEmail = async () => {
    if (!lastInviteToken) return;
    setInviteLoading(true);
    setError(null);

    const res = await fetch("/api/invites/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: lastInviteToken }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(`Email failed: ${err.error}`);
    }
    setInviteLoading(false);
  };

  const handleRoleUpdate = async () => {
    if (!editUserId) return;
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: editRole })
      .eq("id", editUserId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setEditOpen(false);
      setEditUserId(null);
      await refreshData();
    }
  };

  const handleBulkRoleUpdate = async () => {
    if (selectedUserIds.size === 0) return;
    setBulkUpdating(true);
    setError(null);

    try {
      const response = await fetch("/api/users/bulk-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedUserIds), role: bulkRole }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to update roles");
      } else {
        setSelectedUserIds(new Set());
        await refreshData();
      }
    } catch {
      setError("Failed to update roles");
    }

    setBulkUpdating(false);
  };

  const handleResendInvite = async (inviteId: string) => {
    setInviteActionLoadingId(inviteId);
    setError(null);
    try {
      const response = await fetch("/api/invites/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to resend invite");
      }
    } catch {
      setError("Failed to resend invite");
    }
    setInviteActionLoadingId(null);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    setInviteActionLoadingId(inviteId);
    setError(null);
    try {
      const response = await fetch("/api/invites/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to revoke invite");
      } else {
        await refreshData();
      }
    } catch {
      setError("Failed to revoke invite");
    }
    setInviteActionLoadingId(null);
  };

  const copyToClipboard = async (token: string, id: string) => {
    const link = getInviteLink(token);
    await navigator.clipboard.writeText(link);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const resetInviteModal = () => {
    setInviteStep("form");
    setInviteEmail("");
    setInviteRole("new_hire");
    setError(null);
    setLastInviteToken(null);
    setInviteOpen(false);
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout allowedRoles={["company_admin", "super_admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-zinc-500">Manage your team members and invite new users.</p>
          </div>
          <Button className="gap-2" onClick={() => { setInviteStep("form"); setInviteOpen(true); }}>
            <UserPlus className="h-4 w-4" /> Invite User
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {roleOptions.map((r) => (
            <Badge key={r.value} variant="secondary" className="text-xs">
              {r.label}
            </Badge>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit dark:bg-zinc-800">
          <button onClick={() => setTab("users")} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "users" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"}`}>Users</button>
          <button onClick={() => setTab("invites")} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "invites" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"}`}>
            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Invites</span>
          </button>
        </div>

        {tab === "users" ? (
          <>
            <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-zinc-500">
                {selectedUserIds.size > 0
                  ? `${selectedUserIds.size} selected`
                  : "Select users to apply bulk role updates"}
              </div>
              <div className="flex gap-2">
                <select
                  value={bulkRole}
                  onChange={(e) => setBulkRole(e.target.value as UserRole)}
                  className="h-9 rounded-md border border-zinc-200 bg-transparent px-2 text-sm dark:border-zinc-800"
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={handleBulkRoleUpdate}
                  disabled={selectedUserIds.size === 0 || bulkUpdating}
                >
                  {bulkUpdating ? "Updating..." : "Apply Role"}
                </Button>
              </div>
            </div>

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input placeholder="Search users..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800" />
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">
                          <input
                            type="checkbox"
                            checked={filteredProfiles.length > 0 && filteredProfiles.every((p) => selectedUserIds.has(p.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUserIds(new Set(filteredProfiles.map((p) => p.id)));
                              } else {
                                setSelectedUserIds(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Role</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProfiles.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-400">No users found.</td>
                        </tr>
                      ) : (
                        filteredProfiles.map((p) => (
                          <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.has(p.id)}
                                onChange={(e) => {
                                  setSelectedUserIds((prev) => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(p.id);
                                    else next.delete(p.id);
                                    return next;
                                  });
                                }}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">{p.full_name}</td>
                            <td className="px-4 py-3 text-sm text-zinc-500">{p.email}</td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary">{roleOptions.find(r => r.value === p.role)?.label ?? p.role}</Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditUserId(p.id);
                                    setEditUserName(p.full_name);
                                    setEditRole(p.role);
                                    setEditOpen(true);
                                  }}
                                  title="Edit role"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" title="More">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invites</CardTitle>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <Mail className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">No pending invites. Click &quot;Invite User&quot; to invite team members.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invites.map((inv) => {
                    const link = getInviteLink(inv.token);
                    return (
                      <div key={inv.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{inv.email}</p>
                          <p className="text-xs text-zinc-500">
                            {roleOptions.find(r => r.value === inv.role)?.label ?? inv.role} &middot; Expires {new Date(inv.expires_at).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Link className="h-3 w-3 text-zinc-400" />
                            <span className="text-xs text-zinc-400 truncate max-w-[280px]">{link}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {!inv.accepted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => handleResendInvite(inv.id)}
                              disabled={inviteActionLoadingId === inv.id}
                            >
                              <RotateCcw className="h-3 w-3" /> Resend
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => copyToClipboard(inv.token, inv.id)}
                          >
                            {copiedIndex === inv.id ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy Link</>}
                          </Button>
                          {!inv.accepted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs text-red-600"
                              onClick={() => handleRevokeInvite(inv.id)}
                              disabled={inviteActionLoadingId === inv.id}
                            >
                              <Trash2 className="h-3 w-3" /> Revoke
                            </Button>
                          )}
                          <Badge variant={inv.accepted ? "success" : "warning"}>
                            {inv.accepted ? "Accepted" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Modal open={inviteOpen} onClose={resetInviteModal} title={inviteStep === "form" ? "Invite Team Member" : "Invite Created"}>
        {inviteStep === "form" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <div className="space-y-2">
                {roleOptions.map((r) => (
                  <label key={r.value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${inviteRole === r.value ? "border-purple-500 bg-purple-50 dark:bg-purple-950" : "border-zinc-200 dark:border-zinc-800"}`}>
                    <input type="radio" name="inviteRole" value={r.value} checked={inviteRole === r.value} onChange={(e) => setInviteRole(e.target.value as UserRole)} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{r.label}</p>
                      <p className="text-xs text-zinc-500">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetInviteModal}>Cancel</Button>
              <Button className="flex-1 gap-2" onClick={() => handleInvite(true)} disabled={inviteLoading || !inviteEmail.trim()}>
                {inviteLoading ? "Sending..." : <><Mail className="h-4 w-4" /> Send Invite</>}
              </Button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => handleInvite(false)}
                disabled={inviteLoading || !inviteEmail.trim()}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline"
              >
                Create invite link instead (no email)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 text-center">
              <Check className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <p className="font-medium text-green-800 dark:text-green-200">Invite created for {lastInviteEmail}</p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="space-y-2">
              <label className="text-sm font-medium">Invitation Link</label>
              <div className="flex gap-2">
                <Input value={lastInviteToken ? getInviteLink(lastInviteToken) : ""} readOnly className="flex-1 text-xs" />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 shrink-0"
                  onClick={() => lastInviteToken && copyToClipboard(lastInviteToken, "modal")}
                >
                  {copiedIndex === "modal" ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                </Button>
              </div>
            </div>
            <Button className="w-full gap-2" onClick={handleSendEmail} disabled={inviteLoading}>
              {inviteLoading ? "Sending..." : <><Mail className="h-4 w-4" /> Send Email</>}
            </Button>
            <Button variant="outline" className="w-full" onClick={resetInviteModal}>
              Done
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Change Role — ${editUserName}`}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select new role</label>
            <div className="space-y-2">
              {roleOptions.map((r) => (
                <label key={r.value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${editRole === r.value ? "border-purple-500 bg-purple-50 dark:bg-purple-950" : "border-zinc-200 dark:border-zinc-800"}`}>
                  <input type="radio" name="editRole" value={r.value} checked={editRole === r.value} onChange={(e) => setEditRole(e.target.value as UserRole)} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-xs text-zinc-500">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="flex-1 gap-2" onClick={handleRoleUpdate}>
              <Shield className="h-4 w-4" /> Update Role
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
