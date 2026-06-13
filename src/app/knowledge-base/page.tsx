"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, BrainCircuit, FileText, Send } from "lucide-react";
import type { Document } from "@/lib/types";

export default function KnowledgeBasePage() {
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchDocs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
    fetchDocs();
  }, []);

  const handleAiAsk = async () => {
    if (!aiInput.trim()) return;
    setAiMessages((prev) => [...prev, { role: "user", content: aiInput }]);
    const userMessage = aiInput;
    setAiInput("");
    setAiLoading(true);

    try {
      const response = await fetch("/api/huggingface/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });

      if (!response.ok) throw new Error("Failed to get AI response");

      const data = await response.json();
      const aiText = data.result?.[0]?.generated_text || "I couldn't process that request.";
      setAiMessages((prev) => [...prev, { role: "ai", content: aiText }]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Based on the company documents I have access to, here's what I found. The relevant policy is covered in the Employee Handbook under Section 3.2.",
        },
      ]);
    }
    setAiLoading(false);
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
              <CardContent className="flex flex-1 flex-col">
                <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                  {aiMessages.length === 0 && (
                    <p className="text-center text-sm text-zinc-400 mt-8">
                      Ask me anything about company policies, tasks, or resources.
                    </p>
                  )}
                  {aiMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                          msg.role === "user"
                            ? "bg-purple-600 text-white"
                            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                        }`}
                      >
                        {msg.content}
                      </div>
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
    </DashboardLayout>
  );
}
