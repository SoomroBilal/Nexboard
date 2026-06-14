# Nexboard (NativelyAI)

Nexboard is a multi-tenant AI onboarding platform built with Next.js 16 + Supabase.

It includes role-based dashboards, AI-driven onboarding workflows, automation jobs, knowledge-base retrieval, communication tools, and a role-specific quick product tour.

## Core Features

- Multi-tenant company model with scoped data and role-based routing.
- Roles: `super_admin`, `company_admin`, `hr`, `mentor`, `new_hire`, `leadership`, `it_security`.
- AI endpoints powered by server-side Hugging Face integration.
- Onboarding automation (scheduled assignment + overdue nudges + digest reports).
- Communication panel (chat threads + meeting requests).
- Product tour system with first-run trigger and replay from Settings.
- Test suite with Vitest (integration/RBAC) and Playwright (e2e auth/onboarding).
- API hardening with per-IP rate limiting on AI routes.

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4
- Supabase (Auth + Postgres)
- Playwright + Vitest

## Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `HUGGING_FACE_API_TOKEN`

Recommended / optional:

- `SUPABASE_SERVICE_ROLE_KEY` (admin/server-only operations)
- `RESEND_API_KEY`
- `RESEND_SENDER_EMAIL`
- `AI_RATE_LIMIT_MAX_REQUESTS` (default: `30`)
- `AI_RATE_LIMIT_WINDOW_MS` (default: `60000`)
- `AUTOMATION_DIGEST_MAX_COMPANIES` (default: `50`)
- `AUTOMATION_ONBOARDING_MAX_HIRES` (default: `300`)
- `AUTOMATION_ONBOARDING_MAX_OVERDUE` (default: `200`)

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Database Setup

Run schema scripts in Supabase SQL editor:

1. `supabase-schema.sql`
2. `supabase-communication.sql`

Then ensure a super admin exists (example):

```sql
UPDATE public.profiles
SET role = 'super_admin', company_id = NULL
WHERE email = 'admin@nexboard.com';
```

## Quality Commands

```bash
npm run test
npm run test:e2e
npm run build
```

## Product Tour

- Auto-opens on first authenticated dashboard access per user.
- Completion is persisted to `profiles.profile_data` (`product_tour_completed`).
- Users can replay it from `Settings` via `Replay Product Tour`.

## Deployment

Use `DEPLOYMENT_CHECKLIST.md` for release readiness, environment validation, and smoke-test flow.
