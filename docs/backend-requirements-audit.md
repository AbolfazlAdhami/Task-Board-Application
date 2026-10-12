# Backend and application requirements audit

**Audit date:** 2026-10-12  
**Status:** In progress; task CRUD, required automated security tests, and frontend are incomplete.

This audit compares the hiring-task requirements with the current source tree and the build, test, and database results reported during this work. Source presence is not treated as proof that an endpoint or security rule has been verified.

## Verified checks

- `npm run build --workspace=backend` passed after the TODO schema and service changes.
- The `TodoRichContent` migration ran. The database contains `status`, `priority`, `due_date`, and `description jsonb`; the former `is_completed` column is gone.
- The database query returned two existing TODO rows with `description_type = object`.
- `npm run test:e2e --workspace=backend -- --runInBand` passed its single `GET /` smoke test.
- `npm test --workspace=backend -- --runInBand` found no unit tests and exited with code 1.

The e2e smoke test does not verify authentication, authorization, validation, or task endpoints.

## Requirements status

| Area | Current state | Remaining work |
|---|---|---|
| Authentication routes | Login, logout, refresh, and `/auth/me` handlers exist. | Add automated route and cookie tests; confirm behavior through the test app. |
| Refresh-token storage | Auth service stores a SHA-256 hash, not the presented refresh token. | Add a test proving only hashes are persisted and test rotation/reuse behavior. |
| Disabled users | Login checks `isActive`; the JWT strategy reloads the user and rejects inactive accounts; refresh also checks activity. | Add the required old-access-token e2e test and inactive refresh test. |
| User management | `GET /users`, `POST /users`, and `PATCH /users/:id` are owner-only. Last-active-owner protection exists in the service. | Add automated owner/member/manager permission tests and last-owner tests. |
| Request validation | `main.ts` enables `whitelist`, `forbidNonWhitelisted`, and `transform`. | Add endpoint tests for invalid DTOs and unknown fields. No global error-normalization filter was found, so response consistency remains unverified. |
| Seed accounts | Seed script hashes passwords with bcrypt, reads the three accounts from environment variables, and avoids overwriting conflicting existing records. | Put setup, seed command, and development credential guidance in the monorepo README. |
| TODO persistence | Entity and applied migration include title, status, priority, assignee, due date, and JSONB description. | `description` is still nullable in the entity/database. Consider enforcing `NOT NULL` so stored values are always TipTap documents. The initial TODO migration also has no user foreign keys. |
| TipTap validation | Empty `doc` content is accepted. Supported blocks include paragraphs, headings, lists, and blockquotes; marks include bold, italic, and links restricted to HTTP(S). | Add validator tests for allowed/denied nodes, attributes, protocols, and empty documents. |
| TODO API | `POST /todos` exists. | `GET /todos`, `GET /todos/:id`, `PATCH /todos/:id`, and `DELETE /todos/:id` are missing. |
| TODO DTO/service | Create DTO currently covers title, description, and assignee. | Add status, priority, and due date validation. Update DTO still uses the old `description: string` and `isCompleted` fields. Create service does not persist status, priority, or due date and does not verify that an assignee exists and is active. |
| TODO authorization | Create rejects a member assigning to someone else. | Implement owner/manager-wide access, member filtering to created/assigned tasks, member update restrictions, and member deletion limited to tasks they created. Enforce these rules in the service/API. |
| Frontend | Next.js starter page and default dependencies remain. | Build the Persian RTL board, Next.js API proxy, task forms, TipTap editor, and read-only renderer using the same JSON structure. |
| Documentation | `docs/authentication.md` and `docs/user-management.md` exist. Backend/frontend README files are framework starter documents; there is no root monorepo README. | Document setup, migrations, seed command and credentials, API contract, test commands, architecture, and known limitations in a root README. |

## Detailed implementation notes

### Authentication and users

The authentication controller exposes `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, and `GET /auth/me`. It uses HttpOnly cookies; the JWT strategy reloads the user for each authenticated request and rejects inactive users. The user controller protects list, create, and update routes with the owner role. Public registration is commented out; initial users are provisioned by the seed script.

These source-level findings do not replace automated tests. The current e2e suite only tests the root greeting.

### TODO model and access rules

The current controller only exposes `POST /todos`. The service creates a task with its creator taken from the authenticated request and blocks a member from assigning it to another user. It does not yet implement the complete role matrix or the remaining CRUD operations. `UpdateTodoDto` is still based on the earlier `isCompleted` and string-description model and must be replaced with the current status/priority/date/TipTap fields.

### Required automated security tests

Add HTTP e2e tests that prove:

1. A member cannot retrieve another user's task, whether by list or by task ID.
2. A member cannot list, create, or update users.
3. After an owner disables a user, the disabled user's previously issued access token receives `401` on a protected API.

Also test the successful owner/manager/member task flows, DTO rejection of unknown fields, TipTap link protocol validation, and JSONB description persistence.

## Recommended execution order

1. Complete TODO DTOs, service, controller, role/ownership rules, and assignee validation.
2. Add and run the PostgreSQL-backed API e2e tests, including the three required security cases.
3. Update the implementation plan only when a stage is implemented and verified.
4. Build the frontend and JSON-based TipTap read-only view after the backend contract is stable.
5. Complete the root README and delivery checklist from verified behavior.
