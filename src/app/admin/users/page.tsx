"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Search, Plus, MoreHorizontal, Mail, UserPlus, Shield, Pencil } from "lucide-react";
import { useState } from "react";

const roleOptions = [
  { value: "company_admin", label: "Company Admin", desc: "Full access to manage company and users" },
  { value: "hr", label: "HR / L&D", desc: "Manage programs, reports, and new hires" },
  { value: "mentor", label: "Mentor", desc: "Assign tasks and review mentee progress" },
  { value: "new_hire", label: "New Hire", desc: "Access learning paths and playgrounds" },
  { value: "leadership", label: "Leadership", desc: "View executive dashboards and reports" },
  { value: "it_security", label: "IT / Security", desc: "Monitor security and integrations" },
];

export default function AdminUsersPage() {
  const [tab, setTab] = useState<"users" | "invites">("users");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("new_hire");

  return (
    <DashboardLayout allowedRoles={["company_admin", "super_admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-zinc-500">Manage your team members and invite new users.</p>
          </div>
          <Button className="gap-2" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Invite User
          </Button>
        </div>

        {/* Role legend */}
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
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input placeholder="Search users..." className="pl-9" />
            </div>

            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">Status</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Alice Chen", email: "alice@company.com", role: "New Hire", roleVal: "new_hire", status: "Active" as const },
                      { name: "Bob Martinez", email: "bob@company.com", role: "Mentor", roleVal: "mentor", status: "Active" as const },
                      { name: "Carol Smith", email: "carol@company.com", role: "HR", roleVal: "hr", status: "Active" as const },
                      { name: "David Lee", email: "david@company.com", role: "Company Admin", roleVal: "company_admin", status: "Active" as const },
                    ].map((user) => (
                      <tr key={user.email} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{user.email}</td>
                        <td className="px-4 py-3"><Badge variant="secondary">{user.role}</Badge></td>
                        <td className="px-4 py-3"><Badge variant={user.status === "Active" ? "success" : "secondary"}>{user.status}</Badge></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setEditUser(user.name); setEditOpen(true); }} title="Edit role">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="More">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-zinc-400">
                <Mail className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">No pending invites. Click &quot;Invite User&quot; to invite team members.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invite Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Team Member">
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
                  <input type="radio" name="inviteRole" value={r.value} checked={inviteRole === r.value} onChange={(e) => setInviteRole(e.target.value)} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-xs text-zinc-500">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button className="flex-1 gap-2" onClick={() => { setInviteOpen(false); setTab("invites"); }}>
              <Mail className="h-4 w-4" /> Send Invite
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Role Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Change Role — ${editUser}`}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select new role</label>
            <div className="space-y-2">
              {roleOptions.map((r) => (
                <label key={r.value} className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                  <input type="radio" name="editRole" value={r.value} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-xs text-zinc-500">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="flex-1 gap-2"><Shield className="h-4 w-4" /> Update Role</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
