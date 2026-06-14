"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ArrowLeft, Send, Code, MessageSquare, Bug, Presentation, Megaphone, Users, FileText, Sparkles, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const playgroundConfig: Record<string, { name: string; icon: React.ElementType; color: string; promptPrefix: string; apiRoute?: string; requestFields?: Record<string, string> }> = {
  "code-review": { name: "Code Review Arena", icon: Code, color: "text-blue-600", promptPrefix: "Review this code and provide feedback: ", apiRoute: "/api/huggingface/code-review", requestFields: { code: "code", language: "language" } },
  "email-simulation": { name: "Email Simulation", icon: MessageSquare, color: "text-green-600", promptPrefix: "Simulate an email response for this scenario: ", apiRoute: "/api/huggingface/email-simulate", requestFields: { scenario: "scenario", userResponse: "userResponse" } },
  "debugging": { name: "Debugging Scenarios", icon: Bug, color: "text-red-600", promptPrefix: "Help debug this issue: " },
  "sales-simulation": { name: "Sales Pitch Simulator", icon: Presentation, color: "text-orange-600", promptPrefix: "You are a sales coach at a B2B SaaS company. Help the user practice this sales scenario with realistic pushback and objections: " },
  "marketing-simulation": { name: "Marketing Strategy Lab", icon: Megaphone, color: "text-pink-600", promptPrefix: "You are a senior marketing strategist. Help the user develop a campaign strategy for this brief, including channels, messaging, and KPIs: " },
  "leadership-simulation": { name: "Leadership Scenarios", icon: Users, color: "text-indigo-600", promptPrefix: "You are an executive leadership coach. Guide the user through this management or leadership challenge with actionable advice and probing questions: " },
  "document-analysis": { name: "Document Analysis", icon: FileText, color: "text-sky-600", promptPrefix: "Analyze this document: ", apiRoute: "/api/huggingface/document-analysis", requestFields: { document: "document", question: "question" } },
};

const difficultyMap: Record<string, string> = {
  "code-review": "Intermediate",
  "email-simulation": "Beginner",
  "debugging": "Advanced",
  "sales-simulation": "Intermediate",
  "marketing-simulation": "Intermediate",
  "leadership-simulation": "Advanced",
  "document-analysis": "Intermediate",
};

function extractResponseText(data: Record<string, unknown>, playgroundId: string): string {
  if (playgroundId === "code-review") {
    const review = data.review;
    if (Array.isArray(review)) return review.map((r: Record<string, unknown>) => r.generated_text ?? "").join("\n");
    return String(review ?? "");
  }
  if (playgroundId === "email-simulation") {
    const reply = data.reply;
    if (Array.isArray(reply)) return reply.map((r: Record<string, unknown>) => r.generated_text ?? "").join("\n");
    return String(reply ?? "");
  }
  if (playgroundId === "document-analysis") {
    const analysis = data.analysis;
    if (Array.isArray(analysis)) return analysis.map((r: Record<string, unknown>) => r.answer ?? r.generated_text ?? "").join("\n");
    return String(analysis ?? "");
  }
  const result = data.result;
  if (Array.isArray(result)) return result.map((r: Record<string, unknown>) => r.generated_text ?? "").join("\n");
  return String(result ?? "");
}

export default function PlaygroundDetailPage() {
  const params = useParams<{ playgroundId: string }>();
  const config = playgroundConfig[params.playgroundId] || playgroundConfig["code-review"];

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      let aiText = "";

      if (config.apiRoute && config.requestFields) {
        const body: Record<string, string> = {};
        if (params.playgroundId === "code-review") {
          body.code = userInput;
          body.language = "auto";
        } else if (params.playgroundId === "email-simulation") {
          body.scenario = "client communication";
          body.userResponse = userInput;
        } else if (params.playgroundId === "document-analysis") {
          body.document = userInput;
          body.question = "Analyze this document and provide key insights";
        }

        const response = await fetch(config.apiRoute, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error("API error");
        const data = await response.json();
        aiText = extractResponseText(data, params.playgroundId);
      } else {
        const response = await fetch("/api/huggingface/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `${config.promptPrefix}${userInput}`,
            model: params.playgroundId === "debugging" ? "codellama/CodeLlama-7b-hf" : undefined,
          }),
        });

        if (!response.ok) throw new Error("API error");
        const data = await response.json();
        const result = data.result;
        aiText = Array.isArray(result) ? result.map((r: Record<string, unknown>) => r.generated_text ?? "").join("\n") : String(result ?? "");
      }

      setMessages((prev) => [...prev, { role: "ai", content: aiText || "Analysis complete." }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Sorry, the AI service returned an error. Please try again in a moment. If the issue persists, check that the Hugging Face API token is configured.",
        },
      ]);
    }
    setLoading(false);
  };

  const handleGetFeedback = async () => {
    const conversation = messages.map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n");
    if (!conversation.trim()) return;
    setFeedbackLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/huggingface/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userSubmission: conversation, activityType: config.name }),
      });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      const fb = data.feedback;
      setFeedback(Array.isArray(fb) ? fb.map((r: Record<string, unknown>) => r.generated_text ?? r.summary_text ?? "").join("\n") : String(fb ?? ""));
    } catch {
      setFeedback("Unable to generate feedback at this time.");
    }
    setFeedbackLoading(false);
  };

  const Icon = config.icon;

  return (
    <DashboardLayout allowedRoles={["new_hire", "mentor", "leadership"]}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/playgrounds">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${config.color}`} />
              <h1 className="text-xl font-bold">{config.name}</h1>
            </div>
            <p className="text-sm text-zinc-500">
              Interact with AI to practice and improve your skills.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card className="h-[500px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  AI Conversation
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-zinc-400">
                      Start a scenario by typing a message below.
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-purple-600 text-white"
                          : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-zinc-100 px-4 py-2 text-sm dark:bg-zinc-800">
                      <span className="animate-pulse">Analyzing...</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Textarea
                placeholder={
                  params.playgroundId === "code-review"
                    ? "Paste your code snippet..."
                    : params.playgroundId === "document-analysis"
                    ? "Paste document content or ask a question..."
                    : "Type your response..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
                className="min-h-[60px]"
              />
              <Button onClick={handleSubmit} disabled={loading || !input.trim()} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scenario Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Difficulty</span>
                  <Badge variant="secondary">{difficultyMap[params.playgroundId] || "Intermediate"}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  <Badge variant={messages.length > 0 ? "success" : "warning"}>
                    {messages.length > 0 ? "In Progress" : "Not Started"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Messages</span>
                  <Badge variant="secondary">{messages.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">AI Feedback</span>
                  <Badge variant="success">Available</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-500 space-y-2">
                <p>Be specific in your responses for better AI feedback.</p>
                <p>Try different approaches to explore various solutions.</p>
                <p>Use the AI feedback to iteratively improve.</p>
              </CardContent>
            </Card>

            {messages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={handleGetFeedback}
                    disabled={feedbackLoading}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {feedbackLoading ? "Generating..." : "Get AI Feedback"}
                  </Button>
                  {feedback && (
                    <div className="rounded-md bg-zinc-50 p-3 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                      {feedback}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
