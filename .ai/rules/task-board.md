# Task Board Engineering Rules

## Architecture

1. Keep `frontend/` and `backend/` independently understandable and runnable.
2. Browser-to-Next.js is the only browser network path. Next.js owns the versioned proxy route to NestJS.
3. Database access belongs only to the backend.
4. Prefer explicit modules, DTOs, services, and repositories over cross-layer shortcuts.

## Identity and access

1. Roles are `owner`, `manager`, and `member`; define permitted actions in backend policy/guard logic.
2. Members may read tasks they created or are assigned to, cannot assign tasks to others, and cannot delete another user's task.
3. Managers may create, edit, delete, and assign tasks, but cannot manage users.
4. Owners may manage users, but the final active owner cannot be disabled or demoted.
5. Every API request must reject disabled users even if the presented access token was issued earlier.

## Data and validation

1. Keep TypeORM synchronization disabled. Commit migrations for schema changes.
2. Make seeds idempotent and create the required three account roles with hashed passwords.
3. Use strict DTO validation and reject unknown properties.
4. Persist descriptions as TipTap JSON in `jsonb`; validate the supported schema and links server-side.
5. Use one consistent API error envelope and avoid leaking secrets or sensitive internals.

## Frontend and delivery

1. UI language is Persian and layout direction is RTL.
2. Use Headless UI Dialog, Listbox/Menu, and preserve keyboard/focus behavior.
3. Keep access tokens inaccessible to JavaScript by using HttpOnly cookies.
4. Document setup, migrations, seeds, credentials, architecture choices, AI review, and known gaps.
5. Never describe a requirement as complete without implementation and verification evidence.
