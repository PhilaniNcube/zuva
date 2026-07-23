<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->

# ZUVA Scholar Hub

Responsive web app consolidating the ZUVA postgraduate scholar coaching journey (booking, attendance, submissions, feedback, certificates) for Concept Afrika / MINDS.

## Stack

- **Next.js 16 App Router** + React 19, TypeScript, Tailwind CSS 4
- **Turso** (Edge SQLite) via **Drizzle ORM** — schema in `lib/db/schema.ts`, client in `lib/db/index.ts`
- **Better Auth** — email/password, 4 roles on `user.role`: `scholar` | `coach` | `admin` | `minds`; config in `lib/auth.ts`, handler at `app/api/auth/[...all]/route.ts`
- **Cloudflare R2** — file storage via presigned URLs (S3-compatible SDK)
- **Google Calendar API** — Meet links, single programme account (OAuth refresh token)
- **Resend** — transactional email · **@react-pdf/renderer** — certificates
- **Zustand** / **Nuqs** — client state (narrow use only; data stays server-side)

## Commands

- `npm run dev` / `build` / `lint` / `typecheck`
- `npm run db:push` — push schema to DB (local dev uses `file:local.db`)
- `npm run db:seed` — idempotent dev seed (users for all roles, password `password123`)

## Architecture conventions

- Feature-sliced: `features/<domain>/<domain>-queries.ts` (server-only, `cache()`-wrapped) and `<domain>-actions.ts` (`'use server'`), components with sibling skeletons. Pages in `app/` only compose features with `<Suspense>`.
- Route groups by role: `(auth)`, `(scholar)`, `(onboarding)`, `(coach)`, `(admin)`, `(minds)`. Groups don't appear in URLs — role homes live in `lib/roles.ts` (`ROLE_HOME`). `(onboarding)` exists separately so the scholar layout's onboarding redirect can't loop.
- RBAC: `proxy.ts` (root) is the optimistic cookie gate only. Real enforcement is `requireRole(...)` from `lib/rbac.ts` — call it in every role-group layout AND at the top of every server action. Roles are never accepted from client input (`input: false` in `lib/auth.ts`).
- Built features: `user` (auth, onboarding wizard), `cohort` (admin CRUD + scholar enrolment with one-time temp passwords), `coach` (directory CRUD), `session` (availability slots, 1:1 booking, cohort sessions, Join-Call attendance). Planned: `pathway`, `submission`, `resource`, `feedback`, `certificate`.
- Shared client-safe constants live in their own module (e.g. `features/coach/specialties.ts`) — never import from a `-queries.ts` (server-only) file into a client component.
- Server actions: verify role → validate with Zod → mutate → `refresh()` → return `{ ok } | { error }`.
- All timestamps UTC (`integer mode: "timestamp"`); render user-facing times with `<LocalTime>` (`components/local-time.tsx`, client component, browser timezone). `datetime-local` form values are converted to ISO on the client before hitting server actions.
- The domain table for sessions is `programme_session` (`session` is Better Auth's table).
- Google Calendar/Meet (`lib/google-calendar.ts`) no-ops gracefully without credentials (local dev) — sessions then have `meetLink = null` and Join Call shows "Meet link pending". Scholar route is `/sessions`; admin schedule is `/schedule` (route groups share the URL namespace).
- `joinCall` (server action) logs `attendance` for scholars then redirects to the Meet link; coaches/admins redirect without attendance.

## Data model notes

- Feedback is always linked to `scholarId` (needed for the 5-form certificate count) but hidden in UI when `isAnonymous`.
- Certificate eligibility: auto-flag at 5 feedback forms + admin discretion (`certificate.admin_note`); stepper `eligible → pending_approval → issued`; MINDS approves, then PDF generates and emails.
- Attendance is logged by the "Join Call" server action before redirecting to the Meet link.
- Testimonials are explicitly out of scope (on hold per PRD).
