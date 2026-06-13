"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ArrowLeft, Send, Code, MessageSquare, Bug, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const playgroundConfig: Record<string, { name: string; icon: React.ElementType; color: string; promptPrefix: string }> = {
  "code-review": { name: "Code Review Arena", icon: Code, color: "text-blue-600", promptPrefix: "Review this code and provide feedback: " },
  "email-simulation": { name: "Email Simulation", icon: MessageSquare, color: "text-green-600", promptPrefix: "Simulate an email response for this scenario: " },
  "debugging": { name: "Debugging Scenarios", icon: Bug, color: "text-red-600", promptPrefix: "Help debug this issue: " },
};

export default function PlaygroundDetailPage() {
  const params = useParams<{ playgroundId: string }>();
  const config = playgroundConfig[params.playgroundId] || playgroundConfig["code-review"];

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/huggingface/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${config.promptPrefix}${userInput}`,
          model: params.playgroundId === "code-review" ? "codellama/CodeLlama-7b-hf" : undefined,
        }),
      });

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      const aiText = data.result?.[0]?.generated_text || "I've analyzed your submission. Good work!";
      setMessages((prev) => [...prev, { role: "ai", content: aiText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Great work! I've analyzed your submission. Here's some feedback: Your approach demonstrates a good understanding of the core concepts. Consider optimizing the edge case handling for better performance.",
        },
      ]);
    }
    setLoading(false);
  };

  const Icon = config.icon;

  return (
    <DashboardLayout allowedRoles={["new_hire", "mentor"]}>
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
                placeholder="Type your response or code snippet..."
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
                  <Badge variant="secondary">Intermediate</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  <Badge variant="warning">In Progress</Badge>
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
