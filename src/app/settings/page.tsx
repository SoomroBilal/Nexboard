"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bell, Palette, Save, Building2, Globe } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [tab, setTab] = useState<"profile" | "company">("profile");

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-zinc-500">Manage your account and company preferences.</p>
        </div>

        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit dark:bg-zinc-800">
          <button
            onClick={() => setTab("profile")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "profile"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            }`}
          >
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Profile</span>
          </button>
          <button
            onClick={() => setTab("company")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "company"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            }`}
          >
            <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Company</span>
          </button>
        </div>

        {tab === "profile" ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" /> Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">U</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input defaultValue="User" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input defaultValue="user@company.com" type="email" />
                  </div>
                </div>
                <Button className="gap-2"><Save className="h-4 w-4" /> Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4" /> Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Email notifications", desc: "Receive updates via email" },
                  { label: "Task reminders", desc: "Get reminded about upcoming tasks" },
                  { label: "AI feedback alerts", desc: "When new AI feedback is available" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-zinc-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" className="peer sr-only" defaultChecked />
                      <div className="h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-purple-600 peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4" /> Appearance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Dark Mode</p>
                    <p className="text-xs text-zinc-500">Toggle dark mode on/off</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-purple-600 peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" /> Company Settings
              </CardTitle>
              <CardDescription>Manage your organization workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
                  <Building2 className="h-8 w-8 text-purple-600" />
                </div>
                <Button variant="outline" size="sm">Upload Logo</Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input defaultValue="My Company" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Slug</label>
                  <div className="flex items-center gap-1 text-sm text-zinc-500">
                    <span>nexboard.io/</span>
                    <Input defaultValue="my-company" className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Domain</label>
                  <Input defaultValue="company.com" placeholder="your-domain.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Size</label>
                <select className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm dark:border-zinc-800">
                  <option>1-10 employees</option>
                  <option>11-50 employees</option>
                  <option>51-200 employees</option>
                  <option>201-1000 employees</option>
                  <option>1000+ employees</option>
                </select>
              </div>
              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <h4 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h4>
                <Button variant="destructive" size="sm">Delete Company</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
