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

## Stage 3 — Database model and migrations

- [ ] Design users, roles, refresh-token/session records, and task relationships.
- [ ] Add migrations for every schema change; keep TypeORM `synchronize: false` in every environment.
- [ ] Add safe, repeatable seed scripts for one active owner, manager, and member.
- [ ] Hash seeded passwords with argon2 or bcrypt and document development credentials.

## Stage 4 — Authentication and authorization

- [ ] Implement login, logout, refresh, and current-user endpoints.
- [ ] Put access tokens in HttpOnly cookies through the Next.js proxy boundary.
- [ ] Store refresh-token hashes only; rotate/invalidate tokens safely.
- [ ] Reject disabled users at login and on every authenticated request, including old sessions.
- [ ] Enforce owner, manager, and member permissions in NestJS; protect the last active owner.
- [ ] Validate DTOs, reject unknown properties, and normalize error responses.

## Stage 5 — Tasks API and rich text validation

- [ ] Implement the required `/todos` CRUD endpoints and role-aware query/update/delete rules.
- [ ] Validate task fields, statuses, priorities, assignees, and due dates.
- [ ] Store TipTap JSON in PostgreSQL `jsonb`; allow empty documents and only supported node/mark types.
- [ ] Restrict links to `http` and `https`; render read-only content from the same JSON structure.

## Stage 6 — Persian RTL frontend

- [ ] Build the task board, filtering by status and assignee, and role-aware user actions.
- [ ] Use Headless UI Dialog for create/edit and Listbox/Menu for selections/actions.
- [ ] Verify keyboard navigation, focus handling, RTL layout, and accessible labels.
- [ ] Use the Next.js `/api/v1/*` proxy for all browser requests; never call NestJS directly from the browser.

## Stage 7 — Required tests and security review

- [ ] Test that a member cannot view another user's tasks.
- [ ] Test that a member cannot modify users.
- [ ] Test that a disabled user cannot call APIs with an old token.
- [ ] Review role/ownership enforcement, cookie flags, token rotation, unknown-field rejection, and last-owner protection.
- [ ] Verify migrations and seed behavior against an existing database.

## Stage 8 — Documentation and delivery

- [ ] Complete README: setup, environment, Docker Compose, migrations, seeds, sample credentials, architecture, limitations.
- [ ] Document AI use and how generated code was reviewed.
- [ ] Record a Persian screen demonstration under five minutes covering architecture, auth, task flow, TipTap JSON, and key decisions.
- [ ] Mark any unfinished requirements honestly; do not imply incomplete work is done.

## Definition of done

The app starts from documented commands, schema creation occurs through migrations only, seeded accounts are repeatable, all authorization is enforced by NestJS, required tests pass, the UI is Persian/RTL and keyboard accessible, and delivery documentation accurately describes the implementation and its limitations.
