# Nexboard — AI-Powered Employee Onboarding Platform

Nexboard is a **multi-tenant SaaS platform** that transforms employee onboarding into an intelligent, guided, and measurable experience. Built with Next.js 16, React 19, Supabase, and Hugging Face AI.

---

## Architecture Flowchart

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS 16 APP ROUTER                        │
│                                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  PUBLIC   │  │   AUTH   │  │  DASHBOARDS   │  │       ADMIN          │  │
│  │  Pages    │  │  Pages   │  │  (7 roles)    │  │      Pages           │  │
│  │━━━━━━━━━━│  │━━━━━━━━━━│  │━━━━━━━━━━━━━━━│  │━━━━━━━━━━━━━━━━━━━━━│  │
│  │ Landing   │  │ Sign In  │  │ Super Admin   │  │ User Management     │  │
│  │           │  │ Sign Up  │  │ Company Admin  │  │ Task Management     │  │
│  │           │  │          │  │ HR / L&D       │  │ Onboarding Programs │  │
│  │           │  │          │  │ Mentor         │  │ Content Management  │  │
│  │           │  │          │  │ New Hire       │  │ Integrations        │  │
│  │           │  │          │  │ Leadership     │  │                     │  │
│  │           │  │          │  │ IT / Security  │  │                     │  │
│  └──────────┘  └──────────┘  └───────┬───────┘  └──────────┬──────────┘  │
│                                      │                      │             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      SHARED COMPONENTS                              │  │
│  │  DashboardLayout  │  Sidebar  │  Navbar  │  Modal  │  ErrorBoundary │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        API ROUTES (35 endpoints)                    │  │
│  │                                                                     │  │
│  │  ┌─────────┐ ┌─────────┐ ┌──────┐ ┌──────────┐ ┌───────────────┐ │  │
│  │  │  Auth   │ │  Users  │ │Tasks │ │  Invites  │ │  Companies    │ │  │
│  │  │ signup  │ │  CRUD   │ │CRUD  │ │ send      │ │  CRUD         │ │  │
│  │  │ signin  │ │ bulk-   │ │submit│ │ resend    │ │  (super admin)│ │  │
│  │  │ signout │ │ role    │ │feedbk│ │ revoke    │ │               │ │  │
│  │  │ user    │ │         │ │      │ │ validate  │ │               │ │  │
│  │  └─────────┘ └─────────┘ └──────┘ └──────────┘ └───────────────┘ │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────┐ ┌──────────────┐  │  │
│  │  │     AI       │ │ Knowledge    │ │  Chat   │ │  Automation  │  │  │
│  │  │  chat        │ │ Base         │ │ threads │ │  onboarding  │  │  │
│  │  │  gen-tasks   │ │ search       │ │ messages│ │  digest      │  │  │
│  │  │  code-review │ │ ask (cited)  │ │ meetings│ │              │  │  │
│  │  │  feedback    │ │ ingest       │ │         │ │              │  │  │
│  │  │  simulations │ │ delete       │ │         │ │              │  │  │
│  │  └──────────────┘ └──────────────┘ └─────────┘ └──────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│                              EXTERNAL SERVICES                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │    SUPABASE      │  │  HUGGING FACE    │  │        RESEND            │  │
│  │  Auth + Postgres │  │  Llama 3.1 8B    │  │  Transactional Emails    │  │
│  │  RLS Policies    │  │  MiniLM Embed    │  │  Invite Notifications   │  │
│  │  Storage (files) │  │  CodeLlama       │  │                          │  │
│  └─────────────────┘  └──────────────────┘  └──────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Role-Based Access Model

```
super_admin ── Platform-wide control (all companies, system health)
  │
  └── company_admin ── Per-company admin (users, tasks, programs, content)
        │
        ├── hr ── HR / L&D (programs, new hires, reports)
        ├── mentor ── Task review, feedback, communication
        ├── new_hire ── Learner (tasks, playgrounds, knowledge base)
        ├── leadership ── Executive (analytics, ROI reports)
        └── it_security ── System monitoring, compliance
```

Each role has a **custom sidebar navigation** and a **bespoke dashboard** with role-relevant widgets. Data access is enforced by **PostgreSQL Row-Level Security (RLS)** scoped by `company_id`.

---

## Feature Overview

### 1. Authentication & User Onboarding

| Feature | Description |
|---|---|
| **Sign Up** | Two-step: create account → create company → auto-promoted to `company_admin` |
| **Sign In** | Email/password via Supabase Auth |
| **Invite System** | Admin invites users by email with role selection |
| **Invite Acceptance** | `?invite=TOKEN` link → validates via service-role API → auto-assigns role & company |
| **Email Delivery** | Resend integration with branded HTML templates |
| **Invite Lifecycle** | Create, send, resend, revoke, copy invite link, bulk role assignment |

### 2. Role-Specific Dashboards

| Role | Dashboard Widgets |
|---|---|
| **Super Admin** | Total companies, active users, new signups, system uptime; company CRUD (create/edit/suspend/activate/delete) |
| **Company Admin** | User count, active tasks, documents, recent registrations, system health |
| **HR / L&D** | Active programs, new hires, readiness score, mentors active; program overview |
| **Mentor** | Mentee count, readiness scores, pending reviews, hours this week; mentee list with readiness badges |
| **New Hire** | Tasks completed, skill readiness %, playground sessions, AI feedback score; blocker detection, trend chart, next task recommendation |
| **Leadership** | KPIs: avg onboarding time, readiness, active workforce, cost per hire; ROI metrics |
| **IT / Security** | System uptime, security incidents, active alerts, response time, compliance status |

### 3. Admin Modules

| Module | Path | Capabilities |
|---|---|---|
| **User Management** | `/admin/users` | User table with search, role editing, bulk role assignment; invite creation & lifecycle |
| **Onboarding Programs** | `/admin/programs` | CRUD for learning paths; AI-generated programs with role-specific tasks; assign programs to users |
| **Task Management** | `/admin/tasks` | Full CRUD with assignee, due date, inline status change, search; AI-generated tasks |
| **Content Management** | `/admin/content` | Upload and manage knowledge base documents |
| **Integrations** | `/admin/integrations` | HRMS/webhook integration management |

### 4. AI-Powered Features

| Feature | How It Works |
|---|---|
| **AI Chat Assistant** | Context-aware Q&A using Hugging Face Llama 3.1 8B; injected with company KB search results |
| **Cited Answers (Foundry IQ)** | KB assistant returns answer + expandable source citations with document title, excerpt, and match score |
| **AI Task Generation** | Generate 5 role-specific onboarding tasks with a single click; falls back to curated defaults |
| **AI Program Generation** | Create complete onboarding programs with name + structured tasks tailored to target role |
| **Knowledge Base Search** | Hybrid semantic (cosine similarity on embeddings) + keyword search across company documents |
| **Document Ingestion** | Splits content into chunks, generates embeddings, stores in documents table |
| **Code Review** | Automated code review suggestions via CodeLlama-7b |
| **Email Simulation** | AI-generated simulated email replies for training scenarios |
| **Performance Feedback** | AI analysis of simulation performance via distilbart-cnn |

### 5. Collaboration & Communication

| Feature | Details |
|---|---|
| **Chat Threads** | Real-time messaging between mentors and new hires |
| **Meeting Requests** | Request, accept, decline, cancel meetings with subject, agenda, preferred time |
| **Task Submission** | New hires submit tasks for review with evidence/notes |
| **Mentor Feedback** | Mentors review submissions with scores, feedback notes, and timeline |
| **Communication Panel** | Dedicated pages for new hire and mentor communication |

### 6. Automation Engine

| Feature | Details |
|---|---|
| **Onboarding Automation** | Auto-creates Day-1 and Day-7 tasks for eligible new hires |
| **Overdue Nudges** | Identifies overdue tasks and flags them for action |
| **Digest Reports** | Generates company digests: new hires, completed tasks, overdue items, readiness scores |
| **HRMS Webhooks** | `/api/webhooks/hrms` endpoint for external HRMS integration |

### 7. Reports & Analytics

| Report | Metrics |
|---|---|
| **HR / L&D Reports** | Avg readiness, completion rate, time to ready, compliance rate; program performance |
| **Leadership Reports** | Cost savings, productivity gain, time savings, retention rate; ROI summary |
| **IT / Security Reports** | Security score, uptime, vulnerabilities, response time; compliance overview |
| **Reports Hub** | Central navigation to all report types |

### 8. Interactive Playgrounds

| Playground | Type | Purpose |
|---|---|---|
| **Code Review Arena** | `code_review` | Practice reviewing code with AI feedback via CodeLlama |
| **Email Simulation** | `email_simulation` | Simulate professional email scenarios with AI-generated replies |
| **Debugging Scenarios** | `debugging` | Debug real-world code issues with AI assistance |

### 9. Knowledge Base & Cited Answers

| Feature | Details |
|---|---|
| **Document Upload** | Ingest documents with automatic chunking and embedding generation |
| **Hybrid Search** | Semantic (cosine similarity) + keyword search across all company documents |
| **Cited AI Answers** | `/api/knowledge-base/ask` returns grounded answers with source citations (Foundry IQ pattern) |
| **Role-Based Access** | Documents scoped by company; admin/super-admin can manage; all roles can search |

### 10. Platform Infrastructure

| Feature | Details |
|---|---|
| **Rate Limiting** | Per-IP sliding window on all AI routes (default: 30 req/min) |
| **Error Boundary** | Global React error boundary catching render crashes |
| **Session Management** | Supabase SSR middleware for cookie-based session refresh |
| **File Upload** | Supabase Storage for avatar and logo uploads |
| **Product Tour** | Role-specific guided tour on first login; replayable from Settings |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **UI** | React 19, Tailwind CSS v4, Lucide Icons |
| **Database & Auth** | Supabase (PostgreSQL + Auth + RLS) |
| **AI Models** | Hugging Face Inference API (Llama 3.1 8B, MiniLM-L6-v2, CodeLlama-7b) |
| **Email** | Resend |
| **Testing** | Vitest (unit/integration), Playwright (e2e) |
| **Fonts** | Geist Sans + Geist Mono (next/font) |

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Recommended | Service role key (admin operations) |
| `HUGGING_FACE_API_TOKEN` | Yes | Hugging Face Inference API token |
| `RESEND_API_KEY` | Recommended | Resend API key for invite emails |
| `RESEND_SENDER_EMAIL` | Recommended | From-address for invite emails |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL (`http://localhost:3000`) |
| `AI_RATE_LIMIT_MAX_REQUESTS` | No | Default: `30` |
| `AI_RATE_LIMIT_WINDOW_MS` | No | Default: `60000` |
| `AUTOMATION_DIGEST_MAX_COMPANIES` | No | Default: `50` |
| `AUTOMATION_ONBOARDING_MAX_HIRES` | No | Default: `300` |
| `AUTOMATION_ONBOARDING_MAX_OVERDUE` | No | Default: `200` |

---

## Database Schema

```sql
-- 10 tables with multi-tenant isolation:

companies          -- Tenant companies (RLS disabled for signup flow)
profiles           -- Users with role + company_id (RLS enabled)
tasks              -- Onboarding tasks (company-scoped)
learning_paths     -- Onboarding programs (company-scoped)
playgrounds        -- AI training scenarios (company-scoped)
documents          -- Knowledge base content (company-scoped)
performance_metrics -- AI feedback scores (company-scoped)
invites            -- Invite tokens with expiry (company-scoped)
chat_threads       -- Messaging threads (company-scoped)
chat_messages      -- Individual messages (company-scoped)
meeting_requests   -- Meeting scheduling (company-scoped)
```

**Key design decisions:**
- `companies` RLS disabled by design to allow unauthenticated signup
- All other tables have strict RLS policies scoped by `company_id` and role
- Profiles auto-created via `handle_new_user()` trigger on `auth.users` insert
- `updated_at` auto-maintained via trigger on all major tables

---

## API Endpoints

### Authentication
`POST /api/auth/signup` — Create account + company  
`POST /api/auth/signin` — Email/password sign in  
`POST /api/auth/signout` — End session  
`GET /api/auth/user` — Current user + profile

### Companies (Super Admin)
`GET /api/companies` — List all companies  
`POST /api/companies` — Create company  
`PATCH /api/companies/[id]` — Update company  
`DELETE /api/companies/[id]` — Delete company

### Users
`GET /api/users` — List profiles (company-scoped)  
`POST /api/users` — Create profile  
`PATCH /api/users/[id]` — Update profile  
`DELETE /api/users/[id]` — Delete profile  
`POST /api/users/bulk-role` — Bulk role assignment

### Tasks
`GET /api/tasks` — List tasks  
`POST /api/tasks` — Create task  
`GET /api/tasks/[id]` — Get task  
`PATCH /api/tasks/[id]` — Update task  
`DELETE /api/tasks/[id]` — Delete task  
`POST /api/tasks/[id]/submit` — Submit for review  
`POST /api/tasks/[id]/feedback` — Mentor feedback

### Invites
`POST /api/invites/send` — Send invite email  
`POST /api/invites/resend` — Resend invite  
`POST /api/invites/revoke` — Revoke invite  
`GET /api/invites/validate` — Validate invite token

### AI / Hugging Face
`POST /api/huggingface/chat` — General AI chat (Llama 3.1)  
`POST /api/huggingface/generate-tasks` — AI task generation  
`POST /api/huggingface/feedback` — Performance analysis  
`POST /api/huggingface/email-simulate` — Email simulation  
`POST /api/huggingface/code-review` — Code review  
`POST /api/huggingface/document-analysis` — Document Q&A

### Knowledge Base
`POST /api/knowledge-base/ask` — Cited AI answers (Foundry IQ)  
`POST /api/knowledge-base/search` — Hybrid search  
`POST /api/knowledge-base/ingest` — Document ingestion  
`POST /api/knowledge-base/delete` — Delete document

### Communication
`GET/POST /api/chat/threads` — Chat threads  
`GET/POST /api/chat/threads/[id]/messages` — Messages  
`GET/POST /api/meetings` — Meeting requests  
`PATCH /api/meetings/[id]` — Update meeting status

### Automation
`POST /api/automation/onboarding/run` — Create Day-1/Day-7 tasks  
`POST /api/automation/digest/run` — Generate company digest

### Other
`GET/POST /api/playgrounds` — Playground CRUD  
`GET/POST /api/documents` — Document CRUD  
`GET/POST /api/performance-metrics` — Metrics CRUD  
`POST /api/upload` — File upload (avatar/logo)  
`POST /api/webhooks/hrms` — HRMS webhook receiver

---

## Local Setup

```bash
# Install dependencies
npm install

# Set up environment variables
# Copy .env.local with your Supabase URL + keys, Hugging Face token, Resend API key

# Run database schema in Supabase SQL editor:
# 1. supabase-schema.sql
# 2. supabase-communication.sql

# Promote super admin (example):
# UPDATE public.profiles SET role = 'super_admin', company_id = NULL WHERE email = 'admin@nexboard.com';

# Start development server
npm run dev

# Run tests
npm test              # Unit/integration
npm run test:e2e      # E2E (Playwright)
```

---

## Quality Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm test` | Vitest unit/integration tests |
| `npm run test:e2e` | Playwright e2e tests |

---

## Deployment

See `DEPLOYMENT_CHECKLIST.md` for release readiness, environment validation, and smoke-test flow.

---

## Project Status

**Completion: ~94%** — 27 of 33 feature tasks complete.  
See `PROJECT_TRACKER.md` for detailed task registry and execution log.
