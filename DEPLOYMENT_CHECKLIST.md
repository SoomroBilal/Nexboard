# Deployment Checklist

This checklist is the release gate for Nexboard production deployments.

## 1) Environment and Secrets

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured for target environment.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured (server only, never exposed client-side).
- [ ] `HUGGING_FACE_API_TOKEN` configured.
- [ ] `RESEND_API_KEY` configured (if invite emails enabled).
- [ ] `RESEND_SENDER_EMAIL` configured (if invite emails enabled).
- [ ] AI safety limits configured:
  - [ ] `AI_RATE_LIMIT_MAX_REQUESTS`
  - [ ] `AI_RATE_LIMIT_WINDOW_MS`
- [ ] Automation limits configured:
  - [ ] `AUTOMATION_DIGEST_MAX_COMPANIES`
  - [ ] `AUTOMATION_ONBOARDING_MAX_HIRES`
  - [ ] `AUTOMATION_ONBOARDING_MAX_OVERDUE`

## 2) Database Readiness

- [ ] `supabase-schema.sql` applied.
- [ ] `supabase-communication.sql` applied.
- [ ] `admin@nexboard.com` (or designated account) promoted to `super_admin`.
- [ ] Invite tables and RLS behavior validated for signup flow.
- [ ] Cross-company data isolation spot-checked on key tables (`profiles`, `tasks`, `documents`, `meeting_requests`, `chat_threads`).

## 3) Build and Test Gates

Run in CI and locally before release:

```bash
npm run test
npm run test:e2e
npm run build
```

Release only if all pass.

## 4) Functional Smoke Test (Post-Deploy)

- [ ] Unauthenticated access to `/dashboard` redirects to `/auth/signin`.
- [ ] Company signup flow works end-to-end.
- [ ] Invite acceptance flow works from token link.
- [ ] Role redirect from `/dashboard` routes correctly.
- [ ] Product tour appears for first-time user and can be replayed from Settings.
- [ ] Admin can create users/invites and update roles.
- [ ] New hire can submit tasks; mentor can review and provide feedback.
- [ ] Communication panel works (chat + meeting request status updates).
- [ ] AI endpoints respond without exposing token.
- [ ] Rate limit behavior returns `429` and `Retry-After` for repeated AI calls.
- [ ] Automation runners execute successfully from super admin dashboard.

## 5) Observability and Operations

- [ ] Error logs are visible and monitored.
- [ ] API latency for automation and AI routes checked after deploy.
- [ ] Failed invite/email events can be traced.
- [ ] Runbook owner assigned for rollback decisions.

## 6) Rollback Plan

- [ ] Previous deployment artifact is available.
- [ ] Schema changes are backward compatible or rollback SQL prepared.
- [ ] Clear rollback trigger criteria defined (e.g., auth failure rate, API error spike).

## 7) Release Sign-Off

- [ ] Engineering sign-off.
- [ ] Product sign-off.
- [ ] Security/IT sign-off (if required by tenant plan).
- [ ] Deployment timestamp and owner logged.
