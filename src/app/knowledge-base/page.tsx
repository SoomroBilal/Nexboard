"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, BrainCircuit, FileText, Send, Upload, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { Document, UserRole } from "@/lib/types";

interface Citation {
  id: string;
  title: string;
  excerpt: string;
  score: number;
}

interface AiMessage {
  role: "user" | "ai";
  content: string;
  citations?: Citation[];
}

function Markdown({ children }: { children: string }) {
  const parts = children.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return part.split("\n").map((line, j) => (
          <span key={`${i}-${j}`}>
            {j > 0 && <br />}
            {line}
          </span>
        ));
      })}
    </>
  );
}

export default function KnowledgeBasePage() {
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [expandedCitations, setExpandedCitations] = useState<number | null>(null);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [uploading, setUploading] = useState(false);

  const canManage = userRole === "company_admin" || userRole === "super_admin";

  useEffect(() => {
    const fetchDocs = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, role")
        .eq("id", user.id)
        .single();

      if (profile?.company_id) {
        setUserRole(profile.role as UserRole);
        const { data: docs } = await supabase
          .from("documents")
          .select("*")
          .eq("company_id", profile.company_id)
          .order("updated_at", { ascending: false });

        if (docs) setDocuments(docs);
      }
      setLoading(false);
    };
    fetchDocs();
  }, []);

  const handleAiAsk = async () => {
    if (!aiInput.trim()) return;
    setAiMessages((prev) => [...prev, { role: "user", content: aiInput }]);
    const userMessage = aiInput;
    setAiInput("");
    setAiLoading(true);

    try {
      const response = await fetch("/api/knowledge-base/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage }),
      });

      if (!response.ok) throw new Error("Failed to get answer");

      const data = await response.json();
      setAiMessages((prev) => [
        ...prev,
        { role: "ai", content: data.answer, citations: data.citations ?? [] },
      ]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        { role: "ai", content: "Something went wrong. Please try again later.", citations: [] },
      ]);
    }
    setAiLoading(false);
  };

  const handleUpload = async () => {
    if (!uploadTitle.trim() || !uploadContent.trim()) return;
    setUploading(true);
    try {
      const response = await fetch("/api/knowledge-base/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: uploadTitle, content: uploadContent }),
      });

      if (!response.ok) throw new Error("Failed to upload");

      const { document } = await response.json();
      setDocuments((prev) => [
        {
          id: document.id,
          title: uploadTitle,
          content: uploadContent,
          company_id: "",
          uploaded_by_user_id: "",
          access_permissions: {},
          created_at: document.created_at,
          updated_at: document.created_at,
        },
        ...prev,
      ]);
      setUploadTitle("");
      setUploadContent("");
    } catch {
      // no-op for now
    }
    setUploading(false);
  };

  const filteredDocs = query
    ? documents.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()))
    : documents;

  const categories = Array.from(new Set(documents.map((d) => d.title.split(" ")[0] || "General"))).slice(0, 5);
  const categoryCounts = categories.map((cat) => ({
    name: cat,
    count: documents.filter((d) => d.title.startsWith(cat)).length,
  }));

  return (
    <DashboardLayout>
      {canManage ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Knowledge Base</h1>
            <p className="text-zinc-500">
              Search company documents and ask the AI assistant for help.
            </p>
          </div>

          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search the knowledge base..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Upload to Knowledge Base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Document title"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                  />
                  <textarea
                    className="min-h-[120px] w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-800"
                    placeholder="Paste document content here..."
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                  />
                  <Button onClick={handleUpload} disabled={uploading || !uploadTitle.trim() || !uploadContent.trim()} className="gap-2">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Ingest Document"}
                  </Button>
                </CardContent>
              </Card>

              {categoryCounts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categoryCounts.map((cat) => (
                    <Badge key={cat.name} variant="secondary" className="cursor-pointer">
                      {cat.name} ({cat.count})
                    </Badge>
                  ))}
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {loading ? "Loading..." : `${documents.length} Documents`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800" />
                    </div>
                  ) : filteredDocs.length === 0 ? (
                    <p className="py-8 text-center text-sm text-zinc-400">
                      {query ? "No documents match your search." : "No documents available yet."}
                    </p>
                  ) : (
                    filteredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium">{doc.title}</p>
                            <p className="text-xs text-zinc-500">
                              {new Date(doc.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="h-[500px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BrainCircuit className="h-4 w-4 text-purple-600" />
                    AI Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 overflow-y-auto space-y-3 mb-3">
                    {aiMessages.length === 0 && (
                      <p className="text-center text-sm text-zinc-400 mt-8">
                        Ask me anything about company policies, tasks, or resources.
                      </p>
                    )}
                    {aiMessages.map((msg, i) => (
                      <div key={i}>
                        <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                              msg.role === "user"
                                ? "bg-purple-600 text-white"
                                : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                            }`}
                          >
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        </div>
                        {msg.role === "ai" && msg.citations && msg.citations.length > 0 && (
                          <div className="mt-1 flex justify-start">
                            <button
                              onClick={() => setExpandedCitations(expandedCitations === i ? null : i)}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {msg.citations.length} source{msg.citations.length > 1 ? "s" : ""}
                              {expandedCitations === i ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                          </div>
                        )}
                        {msg.role === "ai" && msg.citations && msg.citations.length > 0 && expandedCitations === i && (
                          <div className="mt-2 space-y-2">
                            {msg.citations.map((cit) => (
                              <div
                                key={cit.id}
                                className="rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-900"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{cit.title}</p>
                                  <span className="text-[10px] text-zinc-400">{cit.score}% match</span>
                                </div>
                                <p className="mt-1 text-[11px] text-zinc-500 line-clamp-3">{cit.excerpt}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-800">
                          <span className="animate-pulse">Thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask the AI assistant..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAiAsk()}
                    />
                    <Button
                      size="icon"
                      onClick={handleAiAsk}
                      disabled={aiLoading || !aiInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl pt-8">
          <Card className="flex flex-col" style={{ height: "70vh" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BrainCircuit className="h-4 w-4 text-purple-600" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto space-y-3 mb-3">
                {aiMessages.length === 0 && (
                  <p className="text-center text-sm text-zinc-400 mt-8">
                    Ask me anything about company policies, tasks, or resources.
                  </p>
                )}
                {aiMessages.map((msg, i) => (
                  <div key={i}>
                    <div
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                          msg.role === "user"
                            ? "bg-purple-600 text-white"
                            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                        }`}
                      >
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>
                    {msg.role === "ai" && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-1 flex justify-start">
                        <button
                          onClick={() => setExpandedCitations(expandedCitations === i ? null : i)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {msg.citations.length} source{msg.citations.length > 1 ? "s" : ""}
                          {expandedCitations === i ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </div>
                    )}
                    {msg.role === "ai" && msg.citations && msg.citations.length > 0 && expandedCitations === i && (
                      <div className="mt-2 space-y-2">
                        {msg.citations.map((cit) => (
                          <div
                            key={cit.id}
                            className="rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-900"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{cit.title}</p>
                              <span className="text-[10px] text-zinc-400">{cit.score}% match</span>
                            </div>
                            <p className="mt-1 text-[11px] text-zinc-500 line-clamp-3">{cit.excerpt}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-800">
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ask the AI assistant..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAiAsk()}
                />
                <Button
                  size="icon"
                  onClick={handleAiAsk}
                  disabled={aiLoading || !aiInput.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
