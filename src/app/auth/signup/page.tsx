"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/lib/types";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [step, setStep] = useState<"account" | "company">("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{ company_id: string; role: UserRole } | null>(null);
  const [checkingInvite, setCheckingInvite] = useState(!!inviteToken);

  useEffect(() => {
    if (inviteToken) {
      const validateInvite = async () => {
        setCheckingInvite(true);
        try {
          const res = await fetch(`/api/invites/validate?token=${encodeURIComponent(inviteToken)}`);
          if (!res.ok) {
            const err = await res.json();
            setError(err.error || "Invalid or expired invite link.");
            return;
          }
          const data = await res.json();
          setInviteInfo({ company_id: data.company_id, role: data.role as UserRole });
          setEmail(data.email);
        } catch {
          setError("Failed to validate invite. Please try again.");
        } finally {
          setCheckingInvite(false);
        }
      };
      validateInvite();
    }
  }, [inviteToken]);

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) return;
    if (inviteInfo) {
      handleSignUp(e);
    } else {
      setStep("company");
    }
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const client = createClient();

    const metadata: Record<string, string> = { full_name: fullName };
    if (inviteInfo) {
      metadata.role = inviteInfo.role;
      metadata.company_id = inviteInfo.company_id;
    }

    const { data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Failed to create user account");
      setLoading(false);
      return;
    }

    if (inviteInfo) {
      await client.from("invites").update({ accepted: true }).eq("token", inviteToken);

      if (authData.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Account created! Please check your email to confirm your account, then sign in with the link from your invite.");
        setLoading(false);
      }
      return;
    }

    const { data: company, error: companyError } = await client
      .from("companies")
      .insert({
        name: companyName,
        slug: companySlug || companyName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      })
      .select()
      .single();

    if (companyError) {
      setError(companyError.message);
      setLoading(false);
      return;
    }

    const { error: updateError } = await client
      .from("profiles")
      .update({ company_id: company.id, role: "company_admin" })
      .eq("id", authData.user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const generateSlug = (name: string) => {
    setCompanyName(name);
    setCompanySlug(name.toLowerCase().replace(/[^a-z0-9]/g, "-"));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-2 text-2xl font-bold">
            <BrainCircuit className="h-7 w-7 text-purple-600" />
            Nexboard
          </div>
          {checkingInvite ? (
            <>
              <CardTitle>Validating invite...</CardTitle>
              <CardDescription>Please wait</CardDescription>
            </>
          ) : inviteToken ? (
            <>
              <CardTitle>Accept Invite</CardTitle>
              <CardDescription>You&apos;ve been invited to join a workspace</CardDescription>
            </>
          ) : step === "account" ? (
            <>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>First, set up your personal account</CardDescription>
            </>
          ) : (
            <>
              <CardTitle>Name your company</CardTitle>
              <CardDescription>Create your organization workspace</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {checkingInvite ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800" />
            </div>
          ) : step === "account" ? (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="fullName">Your Full Name</label>
                <Input id="fullName" type="text" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">Work Email</label>
                <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!inviteInfo} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">Password</label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              {error && (
                <div className="space-y-2">
                  <p className="text-sm text-red-500">{error}</p>
                  {inviteToken && (
                    <Button type="button" variant="outline" className="w-full text-sm" onClick={() => router.push("/auth/signin")}>
                      Go to Sign In
                    </Button>
                  )}
                </div>
              )}
              {!error?.includes("check your email") && (
                <Button type="submit" className="w-full" disabled={loading || !!error}>
                  {loading ? "Creating account..." : inviteToken ? "Accept Invite & Sign Up" : "Continue"}
                </Button>
              )}
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="companyName">Company Name</label>
                <Input id="companyName" type="text" placeholder="Acme Inc." value={companyName} onChange={(e) => generateSlug(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company URL</label>
                <div className="flex items-center gap-1 text-sm text-zinc-500">
                  <span>nexboard.io/</span>
                  <Input type="text" placeholder="acme-inc" value={companySlug} onChange={(e) => setCompanySlug(e.target.value)} required className="flex-1" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep("account")} className="flex-1">Back</Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Creating..." : "Create Workspace"}
                </Button>
              </div>
            </form>
          )}
          {!inviteToken && !checkingInvite && (
            <p className="mt-4 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-purple-600 hover:underline">Sign in</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
