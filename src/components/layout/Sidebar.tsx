"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Gamepad2,
  Settings,
  BarChart3,
  Shield,
  GraduationCap,
  Building2,
  UserCog,
  FileText,
  MessageSquare,
  BrainCircuit,
  Globe,
  Mail,
  Briefcase,
} from "lucide-react";

const roleMenuItems: Record<UserRole, { label: string; href: string; icon: React.ElementType }[]> = {
  super_admin: [
    { label: "Dashboard", href: "/dashboard/super-admin", icon: LayoutDashboard },
    { label: "Companies", href: "/dashboard/super-admin?tab=companies", icon: Globe },
    { label: "Users", href: "/dashboard/super-admin?tab=users", icon: Users },
    { label: "System Health", href: "/dashboard/super-admin?tab=system", icon: Shield },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  company_admin: [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: UserCog },
    { label: "Invites", href: "/admin/users?tab=invites", icon: Mail },
    { label: "Programs", href: "/admin/programs", icon: GraduationCap },
    { label: "Tasks", href: "/admin/tasks", icon: FileText },
    { label: "Content", href: "/admin/content", icon: BookOpen },
    { label: "Reports", href: "/reports", icon: BarChart3 },
    { label: "Company Settings", href: "/settings?tab=company", icon: Briefcase },
  ],
  hr: [
    { label: "Dashboard", href: "/dashboard/hr", icon: LayoutDashboard },
    { label: "Programs", href: "/admin/programs", icon: GraduationCap },
    { label: "New Hires", href: "/dashboard/hr?tab=new-hires", icon: Building2 },
    { label: "Tasks", href: "/admin/tasks", icon: FileText },
    { label: "Reports", href: "/reports/hr-ld", icon: BarChart3 },
    { label: "Content", href: "/dashboard/hr?tab=content", icon: BookOpen },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  mentor: [
    { label: "Dashboard", href: "/dashboard/mentor", icon: LayoutDashboard },
    { label: "My Mentees", href: "/dashboard/mentor?tab=mentees", icon: Users },
    { label: "Tasks", href: "/dashboard/mentor?tab=tasks", icon: FileText },
    { label: "Feedback", href: "/dashboard/mentor?tab=feedback", icon: MessageSquare },
    { label: "Documents", href: "/dashboard/mentor?tab=documents", icon: BookOpen },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  new_hire: [
    { label: "Dashboard", href: "/dashboard/new-hire", icon: LayoutDashboard },
    { label: "Learning Paths", href: "/dashboard/new-hire?tab=learning-paths", icon: BookOpen },
    { label: "Playgrounds", href: "/playgrounds", icon: Gamepad2 },
    { label: "Knowledge Base", href: "/knowledge-base", icon: BrainCircuit },
    { label: "Progress", href: "/dashboard/new-hire?tab=progress", icon: BarChart3 },
    { label: "Messages", href: "/dashboard/new-hire?tab=messages", icon: MessageSquare },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  leadership: [
    { label: "Dashboard", href: "/dashboard/leadership", icon: LayoutDashboard },
    { label: "Reports", href: "/reports/leadership", icon: BarChart3 },
    { label: "Analytics", href: "/dashboard/leadership?tab=analytics", icon: BarChart3 },
    { label: "Talent Pipeline", href: "/dashboard/leadership?tab=talent", icon: Users },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  it_security: [
    { label: "Dashboard", href: "/dashboard/it-security", icon: LayoutDashboard },
    { label: "Monitoring", href: "/dashboard/it-security?tab=monitoring", icon: Shield },
    { label: "Integration", href: "/dashboard/it-security?tab=integrations", icon: Settings },
    { label: "Reports", href: "/reports/it-security", icon: BarChart3 },
  ],
};

export function Sidebar({
  role,
  companyName,
  onClose,
}: {
  role: UserRole;
  companyName?: string;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const items = roleMenuItems[role] || roleMenuItems.new_hire;

  return (
    <aside className="flex h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-14 items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <BrainCircuit className="h-6 w-6 text-purple-600" />
          <div className="flex flex-col">
            <span className="text-lg leading-tight">Nexboard</span>
            {companyName && (
              <span className="text-[10px] font-normal text-zinc-500">{companyName}</span>
            )}
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href.split("?")[0]);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
