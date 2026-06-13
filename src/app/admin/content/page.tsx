import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, MoreHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

async function getContentData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) return null;

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("updated_at", { ascending: false });

  return { documents: documents ?? [] };
}

export default async function AdminContentPage() {
  const data = await getContentData();
  if (!data) return null;

  return (
    <DashboardLayout allowedRoles={["company_admin", "super_admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Content Management</h1>
            <p className="text-zinc-500">Manage documents, training materials, and knowledge base content.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Upload Document
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Search documents..." className="pl-9" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.documents.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-zinc-400">
              <FileText className="mx-auto h-8 w-8 mb-2 text-zinc-300" />
              <p>No documents uploaded yet.</p>
            </div>
          ) : (
            data.documents.map((doc) => (
              <Card key={doc.id} className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-950">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{doc.title}</p>
                        <p className="text-xs text-zinc-500">
                          {doc.content ? `${doc.content.length} chars` : "No content"}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-3 text-xs text-zinc-400">
                    Updated {new Date(doc.updated_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
