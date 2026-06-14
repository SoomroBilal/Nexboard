"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, Link, Key, Shield, Check, X, Copy, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminIntegrationsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const [hrmsWebhookUrl, setHrmsWebhookUrl] = useState("");
  const [hrmsApiKey, setHrmsApiKey] = useState("");
  const [atsWebhookUrl, setAtsWebhookUrl] = useState("");
  const [atsApiKey, setAtsApiKey] = useState("");
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [ssoProvider, setSsoProvider] = useState("saml");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [webhookSecret, setWebhookSecret] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) return;
      setCompanyId(profile.company_id);

      const { data: company } = await supabase.from("companies").select("settings").eq("id", profile.company_id).single();
      if (company?.settings) {
        const s = company.settings as Record<string, unknown>;
        setHrmsWebhookUrl((s.hrms_webhook_url as string) || "");
        setHrmsApiKey((s.hrms_api_key as string) || "");
        setAtsWebhookUrl((s.ats_webhook_url as string) || "");
        setAtsApiKey((s.ats_api_key as string) || "");
        setSsoEnabled((s.sso_enabled as boolean) || false);
        setSsoProvider((s.sso_provider as string) || "saml");
        setWebhookSecret((s.webhook_secret as string) || "");
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("companies").update({
      settings: {
        hrms_webhook_url: hrmsWebhookUrl,
        hrms_api_key: hrmsApiKey,
        ats_webhook_url: atsWebhookUrl,
        ats_api_key: atsApiKey,
        sso_enabled: ssoEnabled,
        sso_provider: ssoProvider,
        webhook_secret: webhookSecret,
      },
    }).eq("id", companyId);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const copyWebhookUrl = () => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard.writeText(`${base}/api/webhooks/hrms`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout allowedRoles={["company_admin", "super_admin"]}>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-zinc-500">Connect external HRMS, ATS, and configure SSO.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-blue-600" /> HRMS / ATS Integration
            </CardTitle>
            <CardDescription>
              Connect your HR system to automatically sync new hires and trigger onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">HRMS Webhook URL</label>
                <Input value={hrmsWebhookUrl} onChange={(e) => setHrmsWebhookUrl(e.target.value)} placeholder="https://your-hrms.com/webhook" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">HRMS API Key</label>
                <Input value={hrmsApiKey} onChange={(e) => setHrmsApiKey(e.target.value)} placeholder="sk-..." type="password" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ATS Webhook URL</label>
                <Input value={atsWebhookUrl} onChange={(e) => setAtsWebhookUrl(e.target.value)} placeholder="https://your-ats.com/webhook" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ATS API Key</label>
                <Input value={atsApiKey} onChange={(e) => setAtsApiKey(e.target.value)} placeholder="sk-..." type="password" />
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium mb-2">Incoming Webhook URL</p>
              <p className="text-xs text-zinc-500 mb-2">
                Configure your HRMS/ATS to POST new hire data to this URL. Include a secret in the <code>X-Webhook-Secret</code> header.
              </p>
              <div className="flex gap-2">
                <Input value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/hrms`} readOnly className="text-xs font-mono" />
                <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                  {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-purple-600" /> Single Sign-On (SSO)
            </CardTitle>
            <CardDescription>
              Configure SAML or OIDC-based SSO for your company.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                variant={ssoEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setSsoEnabled(!ssoEnabled)}
                className="gap-2"
              >
                {ssoEnabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {ssoEnabled ? "SSO Enabled" : "SSO Disabled"}
              </Button>
              {ssoEnabled && (
                <select
                  value={ssoProvider}
                  onChange={(e) => setSsoProvider(e.target.value)}
                  className="h-9 rounded-md border border-zinc-200 bg-transparent px-3 text-sm dark:border-zinc-800"
                >
                  <option value="saml">SAML 2.0</option>
                  <option value="oidc">OpenID Connect (OIDC)</option>
                </select>
              )}
            </div>
            {ssoEnabled && (
              <div className="space-y-2">
                <label className="text-sm font-medium">ACS URL / Redirect URI</label>
                <Input value={`${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`} readOnly className="text-xs font-mono" />
                <p className="text-xs text-zinc-500">
                  Configure this as the callback URL in your identity provider.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4 text-amber-600" /> Webhook Security
            </CardTitle>
            <CardDescription>
              Set a shared secret to verify incoming webhook requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Webhook Secret</label>
              <Input value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder="your-webhook-secret" type="password" />
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-900">
              This secret must be sent as the <code className="text-sm">X-Webhook-Secret</code> header by your HRMS/ATS when posting to the webhook URL.
            </div>
          </CardContent>
        </Card>

        <Button className="gap-2" onClick={handleSave} disabled={saving}>
          {saved ? <><Check className="h-4 w-4" /> Saved</> : <><Check className="h-4 w-4" /> Save Integration Settings</>}
        </Button>
      </div>
    </DashboardLayout>
  );
}
