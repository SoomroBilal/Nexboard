# PROJECT TRACKER

## PROJECT OVERVIEW

### Objective
- Build a multi-tenant Nexboard SaaS platform where each company has isolated users, roles, data, onboarding workflows, and analytics dashboards.

### Success Criteria
- Company onboarding works end-to-end (signup -> company -> company admin).
- Role-based access works across all dashboards and admin routes.
- Data is scoped by company and visible only to authorized users.
- AI endpoints and core product flows are connected to real data.
- Tests and docs cover critical flows.

## PROJECT STATUS

## Current Status
- In Progress

## Completion Percentage
- Progress: 68%

## TASK REGISTRY

## TODO
| ID | Task | Priority | Owner | Dependencies |
| --- | --- | --- | --- | --- |
| T-001 | Bind dashboard widgets/tables to real Supabase data | High | Agent | Multi-tenant schema applied |
| T-002 | Implement invite backend flow (create invite, accept invite) | High | Agent | invites table + token handling |
| T-003 | Persist role edits from admin users modal to profiles table | High | Agent | T-001 |
| T-004 | Persist company settings form to companies table | High | Agent | company settings UI complete |
| T-005 | Add super admin company management actions (suspend/delete) | Medium | Agent | T-001 |
| T-006 | Connect playground and knowledge assistant to live AI API routes | Medium | Agent | HUGGING_FACE_API_TOKEN configured |
| T-007 | Add integration and e2e tests for auth/onboarding/RBAC | Medium | Agent | T-001, T-002, T-003 |
| T-008 | Final docs and deployment checklist update | Medium | Agent | Core flows complete |

## IN PROGRESS
| ID | Task | Started | Current Step |
| --- | --- | --- | --- |
| T-000 | Initialize framework tracking file and sync project state | 2026-06-14 01:56 | Writing tracker structure and baseline records |

## COMPLETED
| ID | Task | Completed At | Result |
| --- | --- | --- | --- |
| C-001 | Next.js app scaffolded with TS/Tailwind/App Router | 2026-06-14 00:00 | Project initialized and builds successfully |
| C-002 | Supabase auth, clients, and protected layout flow added | 2026-06-14 00:20 | Signin/signup and auth guard working |
| C-003 | Full route/page skeleton for all stakeholder dashboards | 2026-06-14 00:45 | All required routes implemented |
| C-004 | AI and CRUD API route scaffolding created | 2026-06-14 01:00 | Endpoints available for integration |
| C-005 | Multi-tenant schema and role model introduced | 2026-06-14 01:25 | companies + company_admin/super_admin model in place |
| C-006 | Multi-tenant UI updates (signup, sidebar, super admin page) | 2026-06-14 01:40 | Company-centric navigation and flows added |
| C-007 | Companies RLS blocker resolved by disabling RLS on companies table | 2026-06-14 01:52 | Company creation no longer blocked during signup |

## BLOCKED
| ID | Task | Blocker | Required Action |
| --- | --- | --- | --- |
| B-001 | None currently | N/A | N/A |

## EXECUTION LOG

## Log Entry
Timestamp:
2026-06-14 01:56

Action:
Created persistent tracker file with framework sections.

Reason:
User requested mandatory framework-based tracking in a file before further implementation.

Outcome:
Tracker initialized with current project status, completed tasks, and next implementation queue.

Status Change:
Tracking task T-000 created and set in progress.

Next Recommended Action:
Move T-000 to completed and start T-001 (real data binding).

## DECISION LOG

## Decision
Date:
2026-06-14

Decision:
Disable RLS on `companies` table in schema.

Reason:
Company creation happens during onboarding before stable authenticated context for all signup edge cases.

Impact:
Prevents signup blocker on company creation; shifts strict access control for companies to app logic and admin operations.

Alternatives Considered:
- Complex pre-auth insert policy combinations
- Service-role-only company creation API path

## KNOWLEDGE BASE

- Product is now defined as multi-tenant SaaS.
- Roles: super_admin, company_admin, hr, mentor, new_hire, leadership, it_security.
- User expects company admin to manage internal users and onboarding.
- `admin@nexboard.com` should be promoted to super_admin through schema update.
- Current UI has major flows scaffolded; some forms still not persisted to DB.

## REQUIREMENTS TRACKER

## Confirmed Requirements
- Must support multi-company tenancy.
- Company admin can add/manage users and roles.
- Progress tracking dashboards by role.
- Supabase as DB/auth backend.
- Keep project state in framework-style tracking file.

## Pending Clarifications
- Preferred invite acceptance UX (magic link vs token + password flow).
- Whether to enforce strict RLS on companies later via server-only mutations.

## DEPENDENCY TRACKER

| Dependency | Purpose | Status |
| --- | --- | --- |
| Next.js 16 | Frontend/backend framework | Verified |
| Supabase | Auth + DB | Configured |
| Tailwind CSS | Styling | Verified |
| Hugging Face API token | AI model calls | Needed |

## RISK REGISTER

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Signup regressions due to auth/profile/company sequencing | Medium | High | Add integration tests for onboarding |
| Data leakage across tenants | Low | High | Enforce company filters in API + verify RLS policies |
| Invite flow complexity causes dead-end onboarding | Medium | Medium | Implement token lifecycle + expiry checks early |

## ISSUE TRACKER

| ID | Issue | Status | Resolution |
| --- | --- | --- | --- |
| I-001 | `companies` insert blocked by RLS at signup | Resolved | Disabled RLS on companies table in schema |
| I-002 | Legacy middleware warning in Next.js | Resolved | Migrated to `src/proxy.ts` convention |

## NEXT ACTIONS

1. Complete T-000 by syncing this tracker after file creation.
2. Start T-001: replace mock dashboard data with Supabase queries.
3. Implement T-002 invite backend and connect invite UI actions.

## SESSION HANDOFF

## Current Situation
Core multi-tenant architecture is scaffolded and stable; onboarding blocker resolved.

## Last Completed Work
Created and validated multi-tenant schema flow; fixed company creation policy issue.

## Current Work
Framework tracker initialization and project state synchronization.

## Immediate Next Step
Bind dashboard/admin UI to real Supabase data queries and mutations.

## Known Risks
Remaining feature work is mainly persistence and access control depth.

## Context Needed For Continuation
- Keep tracker updated after each meaningful action.
- Continue from T-001 in TODO section.
