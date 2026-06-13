import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, MoreHorizontal } from "lucide-react";

export default function AdminContentPage() {
  return (
    <DashboardLayout   allowedRoles={["company_admin", "super_admin"]}>
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

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input placeholder="Search documents..." className="pl-9" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Employee Handbook 2026", type: "PDF", pages: "42", updated: "2d ago" },
            { title: "Security Policy v3.2", type: "PDF", pages: "18", updated: "1w ago" },
            { title: "Onboarding Checklist", type: "Doc", pages: "6", updated: "3d ago" },
            { title: "Code of Conduct", type: "PDF", pages: "12", updated: "2w ago" },
            { title: "Engineering Wiki", type: "Markdown", pages: "156", updated: "1d ago" },
            { title: "Data Privacy Guide", type: "PDF", pages: "24", updated: "5d ago" },
          ].map((doc) => (
            <Card key={doc.title} className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-950">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-zinc-500">
                        {doc.type} &middot; {doc.pages} pages
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-3 text-xs text-zinc-400">Updated {doc.updated}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
