# Backend and application requirements audit

**Audit date:** 2026-10-12  
**Backend status:** Core API implementation is in place. Build, automated tests, migrations, and user-reported HTTPie smoke checks have completed. The remaining gaps are recorded below.

## Verification results

| Check | Result |
|---|---|
| `npm run build --workspace=backend` | Passed. |
| `npm test --workspace=backend -- --runInBand` | Passed: 3 suites, 5 tests. |
| `npm run test:e2e --workspace=backend -- --runInBand` | Passed: 1 suite, 1 root `GET /` smoke test. |
| `npm run lint --workspace=backend` | 0 errors; 4 warnings remain. |
| TypeORM migrations | All listed migrations are applied; `migration:run` reported no pending migrations. |
| Auth, users, and todos HTTPie checks | User reports completing the smoke checks in HTTPie Desktop. Individual response codes were not recorded here. |

The e2e suite currently checks only `GET /`; the security tests below are unit/guard tests rather than database-backed HTTP e2e tests.

### Automated security coverage

- Member task isolation: `TodosService` tests verify that another member's task is hidden by ID and that list queries are scoped to tasks created by or assigned to the member.
- User management authorization: the test verifies that `PATCH /users/:id` has owner-only role metadata and that `RolesGuard` rejects a member.
- Disabled account access: the JWT strategy test verifies that a token payload for an inactive account is rejected.

These tests cover the required rules at service/guard/strategy level. Full signed-token HTTP tests against PostgreSQL would provide stronger end-to-end coverage.

## Requirements status

| Area | Current state | Remaining work |
|---|---|---|
| Authentication | `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, and `GET /auth/me` are implemented. Public registration is disabled. Access and refresh tokens are sent in HttpOnly cookies. | Preserve route/cookie checks in the API smoke suite. |
| Refresh-token storage | Refresh JWTs are stored as SHA-256 hashes. Login, rotation, reuse detection, logout revocation, and inactive-user checks are implemented. | Add automated persistence and rotation/reuse integration tests. |
| Cookie paths | Access cookie uses `/`; refresh cookie uses `/api/v1/auth`, matching the global API prefix. Logout clears cookies at matching paths. | None identified in the current smoke run. |
| User management | `GET /users`, `POST /users`, and `PATCH /users/:id` are owner-only. Manager/member access is denied by guards. The service protects the last active owner from disablement or downgrade. | Add database-backed HTTP e2e tests for these policies. |
| Request validation | DTOs use `class-validator`. The global `ValidationPipe` enables `whitelist`, `forbidNonWhitelisted`, and `transform`. | Add broader automated API tests for invalid DTOs and unknown fields. |
| Seed accounts | Seed script creates owner, manager, and member accounts with bcrypt hashes and safely handles existing records. | Replace the Nest starter `backend/README.md` and add a monorepo README documenting setup, seed command, and development credentials. |
| Task API | `GET /todos`, `POST /todos`, `GET /todos/:id`, `PATCH /todos/:id`, and `DELETE /todos/:id` are implemented. | Add endpoint-specific HTTP e2e coverage. |
| Task authorization | Owner and manager can access and manage all tasks. Members are restricted to tasks they created or were assigned; they cannot assign tasks to others or delete another user's task. Active assignees are checked. | Add database-backed HTTP e2e coverage for the complete role matrix. |
| Task fields and description | Title, status, priority, assignee, due date, and TipTap JSON description are supported. Description uses PostgreSQL `jsonb`; empty documents are valid. | Add automated validator and JSONB round-trip tests. |
| TipTap validation | Supported nodes and marks are allow-listed; links accept HTTP and HTTPS only. HTML is not stored as the source of truth. | The read-only renderer belongs to the pending frontend implementation. |
| Frontend | Backend is ready for integration. | Build the Next.js API proxy, Persian RTL task board, forms, TipTap editor, and JSON-based read-only renderer. |

## Current lint warnings

The lint command exits successfully with four warnings and no errors:

- Unused `BadRequestException` and `ConflictException` imports in `auth.service.ts`.
- `String(value.type)` in the TipTap validator triggers `no-base-to-string`.
- The authorization spec references `UsersController.prototype.updateUser` as an unbound method.

## Migration status

The database reports these migrations as applied: `InitialUsers`, `RefreshTokens`, `RefreshTokenFamilyIndex`, `CreateTodos`, `TodoRichContent`, and `TodoDescriptionNotNull`. The latest migration establishes a JSONB empty-document default and `NOT NULL` constraint for task descriptions.

## Documentation and delivery gaps

- `backend/README.md` is still the NestJS starter document; there is no root monorepo README. Seed credentials and project setup need a user-facing home.
- The HTTPie Desktop smoke checks were reported complete, but response-code evidence was not included in the audit record.
- Frontend rendering is pending, including rendering the same TipTap JSON structure in read-only mode.
