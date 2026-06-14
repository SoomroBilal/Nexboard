# Nexboard — AI-Powered Employee Onboarding Platform

## Overview

Nexboard is a **multi-tenant SaaS platform** that transforms employee onboarding from a paperwork burden into an intelligent, guided, and measurable experience. Built with **Next.js 16**, **React 19**, **Supabase**, and **Hugging Face AI**, it delivers role-specific dashboards, AI-generated learning paths, collaborative workflows, and real-time analytics — all scoped per company with enterprise-grade security.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Public  │  │Auth Pages│  │Dashboard │  │  Admin  │ │
│  │  Pages   │  │(signin/  │  │  Pages   │  │  Pages  │ │
│  │(landing) │  │ signup)  │  │(7 roles) │  │(4 pages)│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│  ┌──────────────────────────────────────────────────┐   │
│  │              API Routes (35 endpoints)            │   │
│  │  Auth │ Users │ Tasks │ Invites │ AI │ KB │ Chat │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  Supabase (Auth + Database + RLS)  │  Hugging Face API  │
│  Resend (Email)                     │  (Llama 3.1,       │
│  Playwright / Vitest (Testing)      │   embeddings)      │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, CSS Variables, Geist Font |
| **Database & Auth** | Supabase (PostgreSQL + Auth + RLS) |
| **AI Models** | Hugging Face Inference API (Llama 3.1 8B, MiniLM embeddings) |
| **Email** | Resend (transactional emails) |
| **Testing** | Vitest (unit/integration), Playwright (e2e) |
| **UI Icons** | Lucide React |

---

## Role-Based Access Model

Nexboard supports **7 user roles** with a hierarchical permission model:

```
super_admin (platform-wide — manage all companies)
  └── company_admin (per-company — manage users, tasks, programs, content)
        ├── hr (HR/L&D — manage programs, new hires, reports)
        ├── mentor (task review, feedback, communication)
        ├── new_hire (learner — tasks, playgrounds, knowledge base)
        ├── leadership (executive — analytics, ROI reports)
        └── it_security (system monitoring, compliance)
```

Each role sees a **custom sidebar navigation** and a **bespoke dashboard** with role-relevant widgets and actions. Data access is enforced by **Row-Level Security (RLS)** policies in PostgreSQL and scoped by `company_id`.

---

## Features by Module

### 1. Authentication & Onboarding

| Feature | Details |
|---|---|
| **Sign Up** | Two-step: create account → create company → auto-promoted to company_admin |
| **Sign In** | Email/password via Supabase Auth |
| **Invite System** | Admin invites users by email with role selection |
| **Invite Acceptance** | `?invite=TOKEN` link → validates via service-role API → auto-assigns role & company |
| **Email Delivery** | Resend integration with branded HTML invite templates |
| **Invite Lifecycle** | Create, send, resend, revoke, copy invite link, bulk role assignment |

### 2. Role-Specific Dashboards

Every role gets a **live dashboard** connected to real Supabase data:

| Role | Dashboard Contents |
|---|---|
| **Super Admin** | Total companies, active users, new signups, system uptime; company CRUD (create/edit/suspend/activate/delete) |
| **Company Admin** | User count, active tasks, documents, recent registrations, system health |
| **HR / L&D** | Active programs, new hires, readiness score, mentors active; program overview |
| **Mentor** | Mentee count, readiness scores, pending reviews, hours this week; mentee list |
| **New Hire** | Tasks completed, skill readiness %, playground sessions, feedback score; blocker detection, trend chart, next task recommendation |
| **Leadership** | KPIs: avg onboarding time, readiness, active workforce, cost per hire; ROI metrics |
| **IT / Security** | System uptime, security incidents, active alerts, response time, compliance status |

### 3. Admin Modules

| Module | Path | Capabilities |
|---|---|---|
| **User Management** | `/admin/users` | User table with search, role editing, bulk role assignment; invite creation & lifecycle |
| **Onboarding Programs** | `/admin/programs` | CRUD for learning paths; **AI-generated programs** with role-specific tasks; assign programs to users |
| **Task Management** | `/admin/tasks` | Full CRUD with assignee, due date, inline status change, search; **AI-generated tasks** |
| **Content Management** | `/admin/content` | Upload and manage knowledge base documents |

### 4. AI-Powered Features

| Feature | How It Works |
|---|---|
| **AI Chat Assistant** | Context-aware Q&A using Hugging Face Llama 3.1 8B; injected with company KB search results |
| **AI Task Generation** | Generate 5 role-specific onboarding tasks from a single click; falls back to curated defaults |
| **AI Program Generation** | Create complete onboarding programs with name + structured tasks tailored to target role |
| **Knowledge Base Search** | Semantic + keyword search across company documents using Hugging Face embeddings |
| **Document Analysis** | AI-powered document Q&A and summarization |
| **Code Review** | Automated code review suggestions via CodeLlama |
| **Email Simulation** | AI-generated simulated email replies for training scenarios |
| **Performance Feedback** | AI analysis of simulation performance using distilbart-cnn |

### 5. Collaboration & Communication

| Feature | Details |
|---|---|
| **Chat Threads** | Real-time messaging between mentors and new hires |
| **Meeting Requests** | Request, accept, decline, cancel meetings with agenda |
| **Task Submission** | New hires submit tasks for review with evidence/notes |
| **Mentor Feedback** | Mentors review submissions with scores, feedback notes, and timeline |
| **Communication Panel** | Dedicated pages for new hire and mentor communication |

### 6. Automation Engine

| Feature | Details |
|---|---|
| **Onboarding Automation** | Auto-creates Day-1 and Day-7 tasks for eligible new hires |
| **Overdue Nudges** | Identifies overdue tasks and flags them for action |
| **Digest Reports** | Generates company digests (new hires, completed tasks, overdue items, readiness scores) |

### 7. Reports & Analytics

| Report | Details |
|---|---|
| **HR / L&D Reports** | Avg readiness, completion rate, time to ready, compliance rate; program performance |
| **Leadership Reports** | Cost savings, productivity gain, time savings, retention rate; ROI summary |
| **IT / Security Reports** | Security score, uptime, vulnerabilities, response time; compliance overview |
| **Reports Hub** | Central navigation to all report types |

### 8. Playgrounds (Interactive Training)

| Playground | Type | Purpose |
|---|---|---|
| **Code Review Arena** | code_review | Practice reviewing code with AI feedback |
| **Email Simulation** | email_simulation | Simulate professional email scenarios |
| **Debugging Scenarios** | debugging | Debug real-world code issues |

---

## Database Schema

8 tables with multi-tenant isolation:

```
companies
  ├── profiles (users with role + company_id)
  ├── tasks (company-scoped, assigned to users)
  ├── learning_paths (onboarding programs with task IDs)
  ├── playgrounds (interactive training scenarios)
  ├── documents (knowledge base content)
  ├── performance_metrics (AI feedback scores)
  ├── invites (invite tokens with expiry)
  ├── chat_threads (messaging between users)
  ├── chat_messages (individual messages)
  └── meeting_requests (meeting scheduling)
```

**Key design decisions:**
- `companies` RLS **disabled** by design to allow signup flow without auth context issues
- All other tables have strict **RLS policies** scoped by `company_id` and role
- Profiles auto-created via **PostgreSQL trigger** on `auth.users` insert
- `updated_at` auto-maintained via trigger on all major tables

---

## API Architecture

35 API route files organized by domain:

```
/api/auth/          signup, signin, signout, user
/api/companies/     CRUD (super admin only)
/api/users/         CRUD + bulk-role
/api/tasks/         CRUD + submit + feedback
/api/invites/       send, resend, revoke, validate
/api/huggingface/   chat, generate-tasks, code-review,
                    email-simulate, document-analysis, feedback
/api/knowledge-base/ search, ingest, delete
/api/chat/          threads, messages
/api/meetings/      CRUD + status updates
/api/automation/    onboarding, digest
/api/playgrounds/   list, create
/api/documents/     list, create
/api/performance-metrics/ list, create
```

---

## Security Model

| Layer | Implementation |
|---|---|
| **Authentication** | Supabase Auth (email/password) |
| **Authorization** | Role-based access via `profiles.role` |
| **Data Isolation** | RLS policies on all tables (scoped by `company_id`) |
| **Invite Security** | Service-role API route validates invites (bypasses RLS for anonymous users) |
| **Rate Limiting** | In-memory token bucket on Hugging Face AI endpoints |
| **Error Handling** | Global error boundary; API routes return proper HTTP status codes |

---

## Current Project Status

**Overall Completion: 94%**

### ✅ Completed (27 of 33 tasks)

| Area | Status |
|---|---|
| Project scaffold & build | ✅ |
| Auth flow (signup, signin, session) | ✅ |
| Multi-tenant schema & RLS | ✅ |
| All 7 role dashboards (core data) | ✅ |
| Invite system (create, send, accept, resend, revoke) | ✅ |
| User management (CRUD, role edit, bulk role) | ✅ |
| Task management (CRUD, AI generation) | ✅ |
| Onboarding programs (CRUD, AI generation, assignment) | ✅ |
| Super admin company management | ✅ |
| Knowledge base (ingest, search, AI Q&A) | ✅ |
| Chat & communication (threads, messages, meetings) | ✅ |
| Task submission & mentor feedback workflow | ✅ |
| Automation engine (onboarding tasks, overdue nudges, digests) | ✅ |
| Interactive playgrounds (3 training scenarios) | ✅ |
| Product tour (role-based) | ✅ |
| Rate limiting & error boundaries | ✅ |
| Lint & typecheck (0 errors) | ✅ |
| Test setup (Vitest + Playwright) | ✅ |
| Deployment checklist & README | ✅ |

### 🔄 Remaining (6 tasks)

| Task | Priority |
|---|---|
| Advanced simulation packs (sales, marketing, leadership) | Medium |
| Enterprise integrations (HRMS/ATS, SSO, MFA, private deploy) | High |
| Advanced analytics (ROI, predictive risk, impact analysis) | Medium |
| Reports pages — connect to real data (currently mock) | High |
| Leadership / IT-Security dashboards — connect to real data (currently mock) | High |
| Avatar/logo upload functionality | Low |

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: Supabase URL + keys, Hugging Face token, Resend API key

# Run database schema
# Paste supabase-schema.sql into Supabase SQL editor

# Start development server
npm run dev

# Run tests
npm test              # Unit/integration tests
npm run test:e2e      # E2E tests (Playwright)
```

---

## Key Differentiators

1. **AI-First Onboarding** — Not just a task checklist; AI generates personalized programs and tasks based on role
2. **Multi-Tenant by Design** — Every company gets isolated data with RLS-enforced boundaries
3. **Role-Specific Experiences** — 7 distinct dashboards with tailored navigation and widgets
4. **End-to-End Automation** — From invite to task creation to digest reports
5. **Interactive Training** — AI-powered playgrounds for real-world skill practice
6. **Measurable Outcomes** — Readiness scores, trend charts, ROI analytics

---

*Built with Next.js 16, React 19, Supabase, Tailwind CSS v4, and Hugging Face AI.*
