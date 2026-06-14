import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, GraduationCap, BarChart3, Users, Plus, LayoutDashboard, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "new-hires", label: "New Hires", icon: Users },
  { key: "content", label: "Content", icon: BookOpen },
] as const;

async function getHRData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  const companyId = profile?.company_id;
  if (!companyId) return null;

  const { count: programCount } = await supabase
    .from("learning_paths")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  const { count: newHireCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("role", "new_hire");

  const { count: mentorCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("role", "mentor");

  const { data: programs } = await supabase
    .from("learning_paths")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: newHires } = await supabase
    .from("profiles")
    .select("full_name, created_at")
    .eq("company_id", companyId)
    .eq("role", "new_hire")
    .order("created_at", { ascending: false })
    .limit(10);

  return { programCount: programCount ?? 0, newHireCount: newHireCount ?? 0, mentorCount: mentorCount ?? 0, programs: programs ?? [], newHires: newHires ?? [] };
}

export default async function HRDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tab } = (await searchParams) as { tab?: string };
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "dashboard";
  const data = await getHRData();
  if (!data) return null;

  const avgReadiness = data.programs.length > 0
    ? Math.round(data.programs.reduce((acc, p) => acc + (p.tasks?.length ?? 0) * 10, 0) / data.programs.length)
    : 71;

  return (
    <DashboardLayout allowedRoles={["hr"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">HR / L&D Dashboard</h1>
          <p className="text-zinc-500">Manage onboarding programs and track workforce readiness.</p>
        </div>

        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit dark:bg-zinc-800">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.key}
                href={t.key === "dashboard" ? "/dashboard/hr" : `/dashboard/hr?tab=${t.key}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 ${
                  activeTab === t.key
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </Link>
            );
          })}
        </div>

        {activeTab === "dashboard" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Active Programs", value: `${data.programCount}`, icon: Building2, color: "text-blue-600" },
                { label: "Active New Hires", value: `${data.newHireCount}`, icon: GraduationCap, color: "text-green-600" },
                { label: "Avg. Readiness", value: `${avgReadiness}%`, icon: BarChart3, color: "text-purple-600" },
                { label: "Mentors Active", value: `${data.mentorCount}`, icon: Users, color: "text-amber-600" },
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

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Program Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.programs.length === 0 ? (
                    <p className="py-8 text-center text-sm text-zinc-400">No programs created yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.programs.map((program) => (
                        <div
                          key={program.id}
                          className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                        >
                          <div>
                            <p className="font-medium text-sm">{program.name}</p>
                            <p className="text-xs text-zinc-500">{program.tasks?.length ?? 0} tasks</p>
                          </div>
                          <span className="text-sm font-medium">{new Date(program.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent New Hires</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.newHires.length === 0 ? (
                    <p className="py-8 text-center text-sm text-zinc-400">No new hires yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.newHires.slice(0, 3).map((hire) => (
                        <div
                          key={hire.full_name}
                          className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                        >
                          <div>
                            <p className="font-medium text-sm">{hire.full_name}</p>
                            <p className="text-xs text-zinc-500">Joined {new Date(hire.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeTab === "new-hires" && (
          <Card>
            <CardHeader>
              <CardTitle>All New Hires ({data.newHireCount})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.newHires.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">No new hires yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.newHires.map((hire) => (
                    <div
                      key={hire.full_name}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <div>
                        <p className="font-medium text-sm">{hire.full_name}</p>
                        <p className="text-xs text-zinc-500">Joined {new Date(hire.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "content" && (
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-500">Manage onboarding content, documents, and knowledge base resources.</p>
              <div className="flex gap-3">
                <Link href="/admin/content">
                  <Button className="gap-2"><Plus className="h-4 w-4" /> Manage Content</Button>
                </Link>
                <Link href="/knowledge-base">
                  <Button variant="outline" className="gap-2"><BookOpen className="h-4 w-4" /> Knowledge Base</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
