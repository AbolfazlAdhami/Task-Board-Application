# Phase 0 — Scope and Architecture Baseline

**Status:** Complete, based on the hiring assignment PDF.
**Purpose:** Freeze the requirements and boundaries that implementation phases must honor. This phase creates no application runtime code.

## Product scope

A small production-minded task board with seeded accounts, secure authentication, role-based task/user actions, and Persian RTL UI. Public registration and owner creation through the UI are out of scope. The database is PostgreSQL, started through Docker Compose.

## Required stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, Headless UI, TipTap.
- Backend: NestJS, TypeORM.
- Runtime: Node.js 20+.
- Database: PostgreSQL via Docker Compose.
- Repository: monorepo with clearly separated frontend and backend plus docs.

Exact dependency versions and package manager are intentionally deferred to Phase 1 and should be selected together based on the implementation environment.

## System boundary

```text
Browser -> Next.js frontend and /api/v1/* proxy -> NestJS API -> PostgreSQL
```

- Browser code calls only same-origin Next.js routes.
- Next.js proxies versioned API requests to NestJS and handles cookie forwarding safely.
- NestJS is the authority for identity, permissions, validation, and persistence.
- Only the backend connects to PostgreSQL.
- TypeORM schema changes happen through committed migrations. `synchronize` is always disabled.

## Roles and authorization baseline

| Action                                                    | Owner | Manager | Member                                     |
| --------------------------------------------------------- | ----- | ------- | ------------------------------------------ |
| Manage users, including create/update/disable/role change | Yes   | No      | No                                         |
| Create tasks                                              | Yes   | Yes     | Yes, subject to own-task rules             |
| View tasks                                                | All   | All     | Created by or assigned to the member       |
| Edit tasks                                                | All   | All     | Only own/assigned tasks, per server policy |
| Delete tasks                                              | All   | All     | Cannot delete another user's task          |
| Assign a task to another user                             | Yes   | Yes     | No                                         |

Assignment explicitly states managers can create, edit, delete, and assign any task, and members cannot assign tasks to others or delete another user's task. For member edit scope, use the least-privilege interpretation: only tasks created by or assigned to that member. Enforce this in NestJS, not only in UI controls.

An owner may not disable or demote the last active owner. Disabled users may not log in or make authenticated API calls, including with previously issued access tokens.

## Authentication and session decisions

- Access token: HttpOnly cookie; never expose it to browser JavaScript.
- Refresh token: persist only a cryptographic hash; use rotation and invalidation so logout/disable takes effect.
- Passwords: hash with argon2 or bcrypt.
- Login must reject disabled accounts.
- Every authenticated request must check that the account remains active. Do not rely only on token expiry to revoke disabled users.
- Cookie `Secure`, `SameSite`, domain, and lifetime settings must be configurable for local and production use. Do not hardcode secrets.

## Data baseline

### User

- Identifier, unique login identity (exact field such as email/username to settle in Phase 1), password hash, role, active/disabled state, timestamps.
- Seed exactly one active owner, one manager, and one member safely on repeat runs.

### Task

- Identifier, title, status (`todo`, `in_progress`, `done`), priority, assignee, due date, description, creator, timestamps.
- Description is TipTap JSON stored as PostgreSQL `jsonb`; empty documents are valid.
- Validate the allowed document nodes/marks on the API. Supported formatting: bold, italic, headings, lists, blockquote, and links. Link protocols are only HTTP and HTTPS.
- Render saved descriptions from that JSON representation; HTML is not the source of truth.

### Refresh session

Store the refresh token hash and the minimum metadata needed for rotation, expiry, revocation, and user-wide invalidation. Never store the raw refresh token.

All initial schema is created via migrations. Seeds create records only; they are not a substitute for migrations.

## API contract baseline

Required backend endpoints (browser-facing through Next.js `/api/v1/*`):

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/me`
- `GET /users`
- `POST /users` (owner only)
- `PATCH /users/:id` (owner only)
- `GET /todos`
- `POST /todos`
- `GET /todos/:id`
- `PATCH /todos/:id`
- `DELETE /todos/:id`

Use strict DTO validation and reject unknown fields. Return a consistent error shape without leaking secrets or internal details. List filters must support status and assignee; member results must additionally be ownership-scoped server-side.

## Frontend baseline

- Persian copy and RTL layout throughout.
- Headless UI Dialog for task create/edit forms.
- Headless UI Listbox or Menu for selections and action menus.
- Keyboard navigation and focus management must be usable and accessible.
- Task filters include status and assignee.
- UI role-based hiding is only a usability detail; APIs independently enforce authorization.

## Required security tests

1. A member cannot view another user's task.
2. A member cannot modify users.
3. A disabled user cannot access APIs using an old token.

Also review task ownership for read/update/delete, assignment restrictions, last-owner protection, unknown-field rejection, token rotation/revocation, and safe seed reruns.

## Delivery requirements

README must explain environment setup, Docker Compose, migrations, seed commands and development sample credentials, architecture decisions, and known limitations. Document AI use and review. Deliver a Persian screen recording up to five minutes demonstrating project structure, auth/authorization, task flow, TipTap JSON, and key decisions.

## Open implementation choices for Phase 1

These are implementation details not fixed by the assignment and should be made explicit before scaffolding:

- Workspace package manager and root script conventions.
- User login identifier and exact task priority values.
- Refresh-session storage shape, token lifetimes, and cookie settings.
- Whether managers' task visibility includes every task (assignment says they can manage any task; implement global visibility unless clarified by concrete product constraints).
- API error envelope and pagination defaults.
- Development-only sample credential values and how they are injected into seeds.
