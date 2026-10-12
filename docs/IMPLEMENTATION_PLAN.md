# Task Board Implementation Plan

This is the staged execution plan for the hiring assignment. Complete the stages in order, keeping each stage small enough to review before moving on. The assignment allows up to 60 hours; prioritize security and required functionality over polish.

## Stage 1 — Repository guidance and plan

- [x] Add root `AGENTS.md` with architecture and security invariants.
- [x] Add project AI skill and engineering rules in `.ai/skills/` and `.ai/rules/`.
- [x] Record the implementation sequence here.
- [x] Review this plan and agree the next coding step with the user.

## Stage 2 — Monorepo foundation

- [x] Create `frontend/` (Next.js App Router, TypeScript, Tailwind, Headless UI, TipTap) and `backend/` (NestJS, TypeORM).
- [x] Add root package/workspace scripts and Node.js 24.15+ configuration.
- [x] Add Docker Compose for PostgreSQL and environment examples without secrets.
- [x] Add health checks and document local startup.
- [x] Add `GET /api/v1/health` to report application and PostgreSQL readiness.

## Stage 3 — Database model and migrations

- [x] Design users, roles, refresh-token/session records, and task relationships.
- [x] Add migrations for every schema change; keep TypeORM `synchronize: false` in every environment.
- [x] Add safe, repeatable seed scripts for one active owner, manager, and member.
- [x] Hash seeded passwords with argon2 or bcrypt and document development credentials.

## Stage 4 — Authentication and authorization

- [x] Implement login, logout, refresh, and current-user endpoints.
- [x] Put access tokens in HttpOnly cookies through the Next.js proxy boundary.
- [x] Store refresh-token hashes only; rotate/invalidate tokens safely.
- [x] Reject disabled users at login and on every authenticated request, including old sessions.
- [x] Enforce owner, manager, and member permissions in NestJS; protect the last active owner.
- [x] Validate DTOs, reject unknown properties, and normalize error responses.
- [x] Restrict credentialed browser CORS to the configured frontend origin.

## Stage 5 — Tasks API and rich text validation

- [x] Implement the required `/todos` CRUD endpoints and role-aware query/update/delete rules.
- [x] Validate task fields, statuses, priorities, assignees, and due dates.
- [x] Store TipTap JSON in PostgreSQL `jsonb`; allow empty documents and only supported node/mark types.
- [x] Restrict links to `http` and `https`; render read-only content from the same JSON structure.

## Stage 6 — Persian RTL frontend

- [x] Build the task board, filtering by status and assignee, and role-aware user actions.
- [x] Use Headless UI Dialog for create/edit and Listbox/Menu for selections/actions.
- [x] Verify keyboard navigation, focus handling, RTL layout, and accessible labels with automated user-event, axe, and production-build checks.
- [x] Use the Next.js `/api/v1/*` proxy for all browser requests; never call NestJS directly from the browser.

## Stage 7 — Required tests and security review

- [x] Test that a member cannot view another user's tasks.
- [x] Test that a member cannot modify users.
- [x] Test that a disabled user cannot call APIs with an old token.
- [x] Review role/ownership enforcement, cookie flags, token rotation, unknown-field rejection, and last-owner protection.
- [x] Verify migrations and seed behavior against an existing database.

## Stage 8 — Documentation and delivery

- [x] Complete README: setup, environment, Docker Compose, migrations, seeds, sample credentials, architecture, limitations.
- [x] Document AI use and how generated code was reviewed.
- [ ] Record a Persian screen demonstration under five minutes covering architecture, auth, task flow, TipTap JSON, and key decisions.
- [x] Record any unfinished delivery items honestly in the README and audit.
- [x] Mark any unfinished requirements honestly; do not imply incomplete work is done.

## Definition of done

The app starts from documented commands, schema creation occurs through migrations only, seeded accounts are repeatable, all authorization is enforced by NestJS, required tests pass, the UI is Persian/RTL and keyboard accessible, and delivery documentation accurately describes the implementation and its limitations.
