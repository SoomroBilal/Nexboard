"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

interface Peer {
  id: string;
  full_name: string;
  role: string;
}

interface Message {
  id: string;
  sender_user_id: string;
  message: string;
  created_at: string;
}

interface Meeting {
  id: string;
  requester_user_id: string;
  recipient_user_id: string;
  subject: string;
  agenda?: string;
  preferred_time?: string;
  status: string;
}

export default function NewHireCommunicationPage() {
  const [currentUserId, setCurrentUserId] = useState("");
  const [peers, setPeers] = useState<Peer[]>([]);
  const [selectedPeerId, setSelectedPeerId] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingSubject, setMeetingSubject] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBase = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      setLoading(false);
      return;
    }

    const { data: mentorPeers } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("company_id", profile.company_id)
      .in("role", ["mentor", "hr", "company_admin"])
      .order("full_name");

    setPeers((mentorPeers as Peer[]) ?? []);

    const meetingsRes = await fetch("/api/meetings");
    const meetingsData = await meetingsRes.json();
    setMeetings(meetingsData.meetings ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadBase();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const loadMessages = async (threadId: string) => {
    const res = await fetch(`/api/chat/threads/${threadId}/messages`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load messages");
      return;
    }
    setMessages(data.messages ?? []);
  };

  const openThread = async () => {
    if (!selectedPeerId) return;
    const res = await fetch("/api/chat/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerUserId: selectedPeerId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to open thread");
      return;
    }
    const threadId = data.thread?.id as string | undefined;
    if (!threadId) {
      setError("Failed to open thread");
      return;
    }
    setSelectedThreadId(threadId);
    await loadBase();
    await loadMessages(threadId);
  };

  const sendMessage = async () => {
    if (!selectedThreadId || !messageText.trim()) return;
    const res = await fetch(`/api/chat/threads/${selectedThreadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: messageText.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to send message");
      return;
    }
    setMessageText("");
    await loadMessages(selectedThreadId);
  };

  const requestMeeting = async () => {
    if (!selectedPeerId || !meetingSubject.trim()) return;
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientUserId: selectedPeerId,
        subject: meetingSubject,
        agenda: meetingAgenda,
        preferredTime: meetingTime || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to request meeting");
      return;
    }
    setMeetingSubject("");
    setMeetingAgenda("");
    setMeetingTime("");
    await loadBase();
  };

  const updateMeeting = async (id: string, status: "cancelled") => {
    const res = await fetch(`/api/meetings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update meeting request");
      return;
    }
    await loadBase();
  };

  return (
    <DashboardLayout allowedRoles={["new_hire"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Communication Panel</h1>
          <p className="text-zinc-500">Chat with mentors and request meetings.</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Mentor Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-zinc-400">Loading...</p>
              ) : (
                <>
                  <select
                    value={selectedPeerId}
                    onChange={(e) => setSelectedPeerId(e.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
                  >
                    <option value="">Select mentor/admin...</option>
                    {peers.map((p) => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                    ))}
                  </select>

                  <Button onClick={openThread} disabled={!selectedPeerId}>Open Thread</Button>

                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                    {messages.length === 0 ? (
                      <p className="text-xs text-zinc-400">No messages yet.</p>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m.id}
                          className={`rounded-md px-3 py-2 text-xs ${
                            m.sender_user_id === currentUserId
                              ? "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200"
                              : "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                          }`}
                        >
                          <p>{m.message}</p>
                          <p className="mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                    />
                    <Button onClick={sendMessage} disabled={!selectedThreadId || !messageText.trim()}>
                      Send
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meeting Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Meeting subject"
                value={meetingSubject}
                onChange={(e) => setMeetingSubject(e.target.value)}
              />
              <Textarea
                placeholder="Agenda (optional)"
                value={meetingAgenda}
                onChange={(e) => setMeetingAgenda(e.target.value)}
              />
              <Input type="datetime-local" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
              <Button onClick={requestMeeting} disabled={!selectedPeerId || !meetingSubject.trim()}>
                Request Meeting
              </Button>

              <div className="space-y-2 pt-2">
                {meetings.length === 0 ? (
                  <p className="text-xs text-zinc-400">No meeting requests.</p>
                ) : (
                  meetings.map((m) => (
                    <div key={m.id} className="rounded-md border border-zinc-200 p-2 text-xs dark:border-zinc-800">
                      <p className="font-medium">{m.subject}</p>
                      <p className="text-zinc-500">Status: {m.status}</p>
                      {m.preferred_time && <p className="text-zinc-500">Preferred: {new Date(m.preferred_time).toLocaleString()}</p>}
                      {m.requester_user_id === currentUserId && m.status === "pending" && (
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => updateMeeting(m.id, "cancelled")}>Cancel</Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
