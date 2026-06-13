"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Search, BrainCircuit, FileText, MessageSquare, Send } from "lucide-react";

const categories = [
  { name: "Company Policies", count: 12 },
  { name: "Technical Guides", count: 24 },
  { name: "Onboarding Docs", count: 8 },
  { name: "HR Resources", count: 15 },
];

const popularDocs = [
  { title: "Employee Handbook 2026", category: "Company Policies", updated: "2d ago" },
  { title: "Getting Started with Development", category: "Technical Guides", updated: "1w ago" },
  { title: "Security Best Practices", category: "Technical Guides", updated: "3d ago" },
  { title: "Benefits Overview", category: "HR Resources", updated: "5d ago" },
];

export default function KnowledgeBasePage() {
  const [query, setQuery] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiAsk = async () => {
    if (!aiInput.trim()) return;
    setAiMessages((prev) => [...prev, { role: "user", content: aiInput }]);
    setAiInput("");
    setAiLoading(true);

    setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Based on the company documents I have access to, here's what I found regarding your question. The relevant policy is covered in the Employee Handbook under Section 3.2. You can find more details in the 'Company Policies' category.",
        },
      ]);
      setAiLoading(false);
    }, 1500);
  };

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
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge key={cat.name} variant="secondary" className="cursor-pointer">
                  {cat.name} ({cat.count})
                </Badge>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Popular Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {popularDocs.map((doc) => (
                  <div
                    key={doc.title}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">{doc.title}</p>
                        <p className="text-xs text-zinc-500">{doc.category}</p>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400">{doc.updated}</span>
                  </div>
                ))}
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
