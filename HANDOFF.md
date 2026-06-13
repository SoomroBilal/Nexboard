# Nexboard - Project Handoff Summary

## Project Overview

Nexboard is an AI-powered employee onboarding platform built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, and Supabase. It provides personalized learning paths, AI playgrounds, and role-based dashboards for new hires, mentors, HR, admins, leadership, and IT/security teams.

## Build Status

- TypeScript: ✓ Pass
- Build: ✓ Pass (38 routes compiled)
- All routes: 14 static pages, 16 dynamic API routes, 1 middleware

## What Was Created

### Core Infrastructure
- **Next.js 16** with App Router, TypeScript, Tailwind CSS v4
- **Supabase** (client, server, middleware clients) for auth + database
- **Supabase Auth** with email/password login, signup, session management
- **Row Level Security (RLS)** SQL policies in `supabase-schema.sql`

### Layout & Components
- **Sidebar** - role-aware navigation with icons (lucide-react)
- **Navbar** - user avatar, email, sign-out
- **DashboardLayout** - responsive sidebar layout with mobile overlay
- **AuthGuard** - route protection with role-based access
- **UI Kit** - Card, Button, Badge, Input, Textarea, Avatar components

### Pages (14 pages)

| Route | Description | Auth Required |
|---|---|---|
| `/` | Marketing homepage | No |
| `/auth/signin` | Login page | No |
| `/auth/signup` | Registration page | No |
| `/dashboard` | Role-based redirect | Yes |
| `/dashboard/new-hire` | New hire dashboard | Yes (new_hire) |
| `/dashboard/mentor` | Mentor dashboard | Yes (mentor) |
| `/dashboard/hr` | HR/L&D dashboard | Yes (hr) |
| `/dashboard/admin` | Admin dashboard | Yes (admin) |
| `/dashboard/leadership` | Executive dashboard | Yes (leadership) |
| `/dashboard/it-security` | IT/Security dashboard | Yes (it_security) |
| `/playgrounds` | AI playground listing | Yes |
| `/playgrounds/[id]` | Interactive AI simulation | Yes |
| `/knowledge-base` | Documents + AI assistant | Yes |
| `/settings` | User profile settings | Yes |
| `/admin/users` | User management | Yes (admin) |
| `/admin/content` | Document management | Yes (admin) |
| `/reports` | Reports hub | Yes |
| `/reports/hr-ld` | HR/L&D reports | Yes |
| `/reports/leadership` | Leadership reports | Yes |
| `/reports/it-security` | IT/Security reports | Yes |

### API Routes (16 routes)

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/signup` | POST | User registration |
| `/api/auth/signin` | POST | User login |
| `/api/auth/signout` | POST | User logout |
| `/api/auth/user` | GET | Current user + profile |
| `/api/huggingface/chat` | POST | General AI chat (flan-t5) |
| `/api/huggingface/generate-tasks` | POST | AI task generation (gpt2) |
| `/api/huggingface/code-review` | POST | Code analysis (CodeLlama) |
| `/api/huggingface/email-simulate` | POST | Email simulation (BlenderBot) |
| `/api/huggingface/feedback` | POST | Performance feedback (DistilBART) |
| `/api/huggingface/document-analysis` | POST | Document QA (LayoutLM) |
| `/api/tasks` | GET/POST | Task list / create |
| `/api/tasks/[id]` | GET/PATCH/DELETE | Task CRUD |
| `/api/users` | GET/POST | User list / create |
| `/api/users/[id]` | PATCH/DELETE | User update/delete |
| `/api/documents` | GET/POST | Document list / upload |
| `/api/playgrounds` | GET/POST | Playground list / create |
| `/api/performance-metrics` | GET/POST | Metrics list / create |

## Database (Supabase)

The `supabase-schema.sql` defines 6 tables with RLS policies:

- **profiles** - extends auth.users with role, full_name, avatar_url
- **tasks** - assigned to users with status, feedback, due dates
- **learning_paths** - groups of tasks
- **playgrounds** - AI simulation configurations
- **documents** - knowledge base content with access controls
- **performance_metrics** - scores and analytics per user

### To set up Supabase:
1. Create a Supabase project at https://supabase.com
2. Copy your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run the SQL in `supabase-schema.sql` in the Supabase SQL editor
4. Copy `.env.local.example` to `.env.local` and fill in credentials

### Authentication Flow:
- Supabase Auth handles JWT session management
- Middleware (`src/middleware.ts`) refreshes sessions on every request
- `AuthGuard` component protects client-side routes
- API routes check `supabase.auth.getUser()` server-side

## Hugging Face Integration

AI features are routed through server-side API routes (never exposed to client):

- **Chat**: `google/flan-t5-xxl`
- **Task Generation**: `gpt2`
- **Code Review**: `codellama/CodeLlama-7b-hf`
- **Email Simulation**: `facebook/blenderbot-400M-distill`
- **Feedback**: `sshleifer/distilbart-cnn-12-6`
- **Document Analysis**: `impira/layoutlm-document-qa`

Set `HUGGING_FACE_API_TOKEN` in `.env.local`.

## Dependencies

Core:
- `next@16.2.9`, `react@19.2.4`, `react-dom@19.2.4`
- `@supabase/supabase-js`, `@supabase/ssr`, `@supabase/auth-ui-react`
- `@huggingface/inference`
- `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`

Dev:
- `typescript`, `tailwindcss`, `@tailwindcss/postcss`
- `eslint`, `eslint-config-next`

## Quick Start

```bash
# Copy env file and fill in credentials
cp .env.local.example .env.local

# Run Supabase SQL in dashboard (supabase-schema.sql)

# Start development server
npm run dev
```

## Next Development Priorities

1. **Connect real Supabase project** - set up project, run schema SQL, configure credentials
2. **Integrate Hugging Face** - add API token, test AI endpoints
3. **Build out detailed pages** - the role dashboards have placeholder data; connect to real API data
4. **Add more playground types** - expand simulation scenarios
5. **File upload** - implement document upload for knowledge base
6. **Real-time chat** - add Supabase Realtime for messaging between users
7. **SSO/MFA** - configure Supabase Auth providers (Google, GitHub, etc.)
8. **Testing** - add unit tests (Vitest) and E2E tests (Playwright/Cypress)
