"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Building2, Save, Check, Upload, Loader2, Shield, Fingerprint, Globe } from "lucide-react";
import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const router = useRouter();
  const { tab: initialTab } = use(searchParams);
  const [tab, setTab] = useState<"profile" | "company">(
    initialTab === "company" ? "company" : "profile"
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, company_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        setProfileId(profile.id);
        setFullName(profile.full_name);
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);

        if (profile.company_id) {
          setCompanyId(profile.company_id);
          const { data: company } = await supabase
            .from("companies")
            .select("name, slug, domain, logo_url")
            .eq("id", profile.company_id)
            .single();

          if (company) {
            setCompanyName(company.name);
            setCompanySlug(company.slug);
            setCompanyDomain(company.domain ?? "");
            if (company.logo_url) setLogoUrl(company.logo_url);
          }
        }
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleProfileSave = async () => {
    if (!profileId) return;
    setSaving(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profileId);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleCompanySave = async () => {
    if (!companyId) return;
    setSaving(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("companies")
      .update({
        name: companyName,
        slug: companySlug,
        domain: companyDomain || null,
      })
      .eq("id", companyId);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleUpload = async (file: File, owner: string, type: "avatar" | "logo") => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("owner", owner);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const supabase = createClient();
      if (type === "avatar") {
        await supabase.from("profiles").update({ avatar_url: data.url }).eq("id", profileId!);
        setAvatarUrl(data.url);
      } else {
        await supabase.from("companies").update({ logo_url: data.url }).eq("id", companyId!);
        setLogoUrl(data.url);
      }
    } catch {
      // silently fail
    }
    setUploading(false);
  };

  const handleReplayTour = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("force_product_tour", "1");
    }
    router.push("/dashboard");
    router.refresh();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-zinc-500">Manage your account and company preferences.</p>
        </div>

        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 w-fit dark:bg-zinc-800">
          <button
            onClick={() => setTab("profile")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "profile"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            }`}
          >
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Profile</span>
          </button>
          <button
            onClick={() => setTab("company")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "company"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            }`}
          >
            <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Company</span>
          </button>
        </div>

        {tab === "profile" ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" /> Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" fill className="object-cover rounded-full" />
                    ) : (
                      <AvatarFallback className="text-lg">{fullName.charAt(0) || "U"}</AvatarFallback>
                    )}
                  </Avatar>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && profileId) handleUpload(file, profileId, "avatar");
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Uploading..." : "Change Avatar"}
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input value={email} type="email" disabled className="text-zinc-500" />
                  </div>
                </div>
                <Button className="gap-2" onClick={handleProfileSave} disabled={saving}>
                  {saved ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save Changes</>}
                </Button>
                <Button type="button" variant="outline" onClick={handleReplayTour}>
                  Replay Product Tour
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-purple-600" /> Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium">Multi-Factor Authentication</p>
                      <p className="text-xs text-zinc-500">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" /> Company Settings
              </CardTitle>
              <CardDescription>Manage your organization workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                    <Image src={logoUrl} alt="Company logo" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
                    <Building2 className="h-8 w-8 text-purple-600" />
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && companyId) handleUpload(file, companyId, "logo");
                  }}
                />
                <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Upload Logo"}
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Slug</label>
                  <div className="flex items-center gap-1 text-sm text-zinc-500">
                    <span>nexboard.io/</span>
                    <Input value={companySlug} onChange={(e) => setCompanySlug(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Domain</label>
                  <Input value={companyDomain} onChange={(e) => setCompanyDomain(e.target.value)} placeholder="your-domain.com" />
                </div>
              </div>
              <Button className="gap-2" onClick={handleCompanySave} disabled={saving}>
                {saved ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save Changes</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4 text-blue-600" /> Single Sign-On
              </CardTitle>
              <CardDescription>Configure SSO for your organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-medium">SSO via SAML / OIDC</p>
                  <p className="text-xs text-zinc-500">Manage SSO settings in Integrations.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push("/admin/integrations")}>
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
