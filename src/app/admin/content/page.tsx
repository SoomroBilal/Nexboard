"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Search, Plus, FileText, Trash2, Loader, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/lib/types";

export default function AdminContentPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profile?.company_id) {
      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("updated_at", { ascending: false });

      if (docs) setDocuments(docs);
    }
    setLoading(false);
  };

  const openUploadModal = () => {
    setUploadTitle("");
    setUploadContent("");
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  };

  const handleUpload = async () => {
    if (!uploadTitle.trim() || !uploadContent.trim()) return;
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/knowledge-base/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: uploadTitle, content: uploadContent }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to upload document");
        return;
      }

      setSuccess("Document uploaded and indexed into knowledge base.");
      setTimeout(() => { setModalOpen(false); setSuccess(null); }, 1200);
      fetchDocuments();
    } catch {
      setError("Failed to upload document");
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document? It will be removed from the knowledge base.")) return;
    const res = await fetch("/api/knowledge-base/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchDocuments();
  };

  const filtered = searchQuery
    ? documents.filter((d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents;

  return (
    <DashboardLayout allowedRoles={["company_admin", "super_admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Content Management</h1>
            <p className="text-zinc-500">Upload documents and training materials to power the knowledge base.</p>
          </div>
          <Button className="gap-2" onClick={openUploadModal}>
            <Plus className="h-4 w-4" /> Upload Document
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search documents..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-zinc-400">
              <FileText className="mx-auto h-8 w-8 mb-2 text-zinc-300" />
              <p>{searchQuery ? "No documents match your search." : "No documents uploaded yet."}</p>
            </div>
          ) : (
            filtered.map((doc) => (
              <Card key={doc.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 rounded-lg bg-purple-100 p-2 dark:bg-purple-950">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">{doc.title}</p>
                        <p className="text-xs text-zinc-500">
                          {doc.content ? `${doc.content.length.toLocaleString()} chars` : "No content"}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-red-500" />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Upload Document">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Title</label>
            <Input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Employee Handbook 2026"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={uploadContent}
              onChange={(e) => setUploadContent(e.target.value)}
              placeholder="Paste the document content here. It will be chunked and indexed into the knowledge base."
              rows={8}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleUpload}
              disabled={uploading || !uploadTitle.trim() || !uploadContent.trim()}
            >
              {uploading ? (
                <><Loader className="h-4 w-4 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="h-4 w-4" /> Ingest & Save</>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
