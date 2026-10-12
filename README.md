# Task Board

A Persian, right-to-left task board built as a TypeScript monorepo. The Next.js frontend runs on port `3000`; NestJS serves the API on port `3001`; PostgreSQL runs in Docker Compose on port `5433` by default.

## Features

- Cookie-based authentication with short-lived access tokens and rotating refresh tokens.
- Owner, manager, and member roles enforced in NestJS.
- Task board with status, priority, assignee, due date, and TipTap JSON descriptions.
- User directory with owner-only account creation and management.
- Persian RTL UI, light/dark themes, and locally bundled Vazirmatn font.
- Next.js route protection redirects users without a session cookie to `/login`; the dashboard then validates the session against NestJS. The route proxy is an early navigation check, while the API remains the security boundary.

## Requirements

- Node.js `24.15` or newer and npm.
- Docker Desktop or Docker Engine with Compose.

## Local setup

Run commands from the repository root:

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run migration:run --workspace=backend
npm run seed:users --workspace=backend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend sends browser API requests to its own `/api/v1/*` path; Next.js rewrites them to NestJS. The API is available at [http://localhost:3001/api/v1](http://localhost:3001/api/v1), and readiness is reported at `/api/v1/health`.

Copy `.env.example` only for local development. Before deployment, replace every placeholder secret and password, set the correct frontend/backend/database origins, and use HTTPS. Never use the sample credentials in a shared or production environment.

## Seeded development accounts

The seed script reads the email addresses and passwords from `.env`. The values below are the local defaults in `.env.example`:

| Role | Email | Development-only password |
|---|---|---|
| Owner | `owner@example.com` | `OwnerLocal2026!` |
| Manager | `manager@example.com` | `ManagerLocal2026!` |
| Member | `member@example.com` | `MemberLocal2026!` |

Seeded passwords are bcrypt-hashed. The seed is repeatable: it inserts missing records and verifies existing records without overwriting their credentials or profile data. Owners can create additional accounts through the authenticated API and UI; public registration is disabled.

## Database changes

Schema changes are TypeORM migrations. `synchronize` is disabled.

```bash
npm run migration:show --workspace=backend
npm run migration:run --workspace=backend
```

Generate a migration after changing an entity with:

```bash
npm run migration:generate --workspace=backend -- src/common/database/migrations/DescriptiveName -d src/common/database/data-source.ts
```

Review generated SQL before applying it. Keep applied migration files in version control.

## Tests and checks

```bash
npm test --workspace=frontend
npm run lint --workspace=frontend
npm run build --workspace=frontend

npm test --workspace=backend -- --runInBand
npm run test:e2e --workspace=backend -- --runInBand
npm run build --workspace=backend
npm run lint --workspace=backend
```

Backend e2e tests use the configured PostgreSQL database and create temporary users/tasks; they remove those records afterward. Frontend tests cover the unauthenticated dashboard redirect, role-aware user actions, dialog keyboard/focus behavior, and automated accessibility checks.

## Architecture and security

- `frontend/` contains the Next.js App Router UI, `/api/v1/*` proxy, and shared Axios client.
- `backend/` contains NestJS controllers, DTO validation, authorization, TypeORM entities, migrations, and seeds.
- `docs/` contains the implementation plan, requirements audit, API notes, and security decisions.
- PostgreSQL is the only persistence service. No admin UI framework is used.
- API DTOs reject unknown fields. Access tokens remain in HttpOnly cookies; refresh JWTs are stored only as SHA-256 hashes.
- Disabled users cannot log in and their existing access token is rejected on the next API request. The last active owner cannot be disabled or demoted.
- Task descriptions are TipTap JSON stored in PostgreSQL `jsonb`; allowed nodes and marks are validated server-side and links require HTTP or HTTPS.

See [authentication](docs/authentication.md), [user management](docs/user-management.md), [todos API](docs/todos-api.md), [architecture decisions](docs/architecture/decisions.md), and the [backend requirements audit](docs/backend-requirements-audit.md).

## Known delivery items

- Automated keyboard/focus and axe checks pass. A live keyboard walkthrough and screen-reader review remain open; browser control did not allow a reliable end-to-end focus-order check.
- The Persian demonstration video requested by the assignment has not been recorded or attached. Record a walkthrough under five minutes before final submission, covering architecture, login/refresh, user roles, task flow, TipTap JSON, and security decisions.
- Follow-up coverage can add member assignment/deletion edge cases, malformed TipTap document cases, and migration failure paths. The required authorization scenarios and manager/owner task CRUD paths already have automated coverage.

## AI-assisted work

AI assistance was used to draft and refine implementation code, tests, and technical documentation. The repository owner reviewed the changes, ran the listed checks, and manually exercised API flows with HTTPie Desktop. Automated test/build results and remaining limitations are recorded in `docs/` rather than treated as proof of untested behavior.
