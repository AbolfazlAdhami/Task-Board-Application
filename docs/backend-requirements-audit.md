# Backend and application requirements audit

**Audit date:** 2026-10-12

## Verification results

| Check | Result |
|---|---|
| Backend build | Passed. |
| Backend unit tests | Passed: 4 suites, 7 tests. |
| Backend HTTP e2e tests | Passed: 2 suites, 9 tests against PostgreSQL. |
| Backend lint | Passed with no warnings. |
| Frontend TypeScript | Passed. |
| Frontend Jest tests | Passed: 3 suites, 7 tests, including axe and keyboard/focus checks. |
| Frontend lint | Passed with no warnings. |
| Frontend production build | Passed with Next.js Turbopack. Vazirmatn is bundled locally, so build does not need Google Fonts access. |
| TypeORM migrations | All six migrations are applied; `migration:run` reported no pending migrations. |
| Existing-database seed run | Passed; all configured accounts were verified and existing records were not overwritten. |
| HTTPie Desktop checks | The developer reported checking auth, users, and todos manually; individual response evidence was not included in the record. |

### Automated coverage

- Member task isolation: unit tests verify member list scope and hidden access by ID; a PostgreSQL-backed HTTP test verifies `404` for another member's task.
- User authorization: HTTP e2e verifies members cannot create/update users, owners can create/update users, and managers can list users but cannot modify them.
- Disabled account: the JWT strategy unit test and HTTP e2e verify an old access cookie is rejected after deactivation.
- Last active owner: a service unit test verifies both disable and downgrade requests are rejected.
- Refresh sessions: HTTP e2e verifies hash-only persistence, rotation, token reuse family revocation, and logout revocation.
- DTO validation: HTTP e2e verifies unknown task fields are rejected. Manager and owner task CRUD is covered over HTTP.
- Frontend: Jest verifies the no-cookie route redirect, invalid-session dashboard redirect, role-aware user actions, Escape/focus restoration, and axe checks on the user directory.

## Requirements status

| Area | Current state | Remaining work |
|---|---|---|
| Authentication | Login, logout, refresh, and current-user routes are implemented; access/refresh cookies are HttpOnly; disabled users are rejected. | Add stress tests for concurrent token rotation and more expired-token cases. |
| Refresh-token storage | Refresh JWTs are stored as SHA-256 hashes; rotation, reuse revocation, and logout are covered by PostgreSQL-backed e2e tests. | None required by the assignment. |
| User management | Owners and managers can list users; only owners can create/update. The last active owner cannot be disabled or demoted. | Add more validation and failure-path cases as follow-up coverage. |
| Validation | DTOs use class-validator; the global pipe rejects unknown fields; an e2e case verifies this behavior. | Add more invalid-field cases for each DTO. |
| Seed accounts | Idempotent seed creates an active owner, manager, and member; bcrypt hashes passwords. Existing database run passed. | None required by the assignment. |
| Task API | Required todo CRUD routes are implemented; manager and owner create/read/update/delete paths are covered over HTTP, including task fields and TipTap empty JSON. | Add more error-path and JSONB round-trip cases as optional coverage. |
| Task authorization | Owner/manager can manage all tasks; members are scoped to created/assigned tasks and cannot assign others or delete another user's task. Member isolation is verified by service and HTTP tests. | Add HTTP e2e cases for member assignment and deletion restrictions. |
| Task fields and rich descriptions | Status, priority, assignee, due date, and TipTap JSON are supported; JSONB is the source of truth and empty documents are valid. | Add broader JSONB round-trip and malformed-document integration tests. |
| TipTap validation | Supported nodes/marks are allow-listed; links require HTTP or HTTPS; HTML is not stored as canonical content. | None required by the assignment. |
| Frontend | Persian RTL dashboard, cookie-presence route proxy, validated session check, user directory, task board, and JSON renderer are implemented. Component tests and production build pass. | A live keyboard walkthrough and screen-reader review remain open; browser control did not allow a reliable end-to-end focus-order check. |

## Migration status

The database reports these migrations as applied: `InitialUsers`, `RefreshTokens`, `RefreshTokenFamilyIndex`, `CreateTodos`, `TodoRichContent`, and `TodoDescriptionNotNull`. `synchronize` remains disabled.

## Delivery notes

- Root `README.md` documents setup, ports, migrations, seed commands, local-only credentials, tests, architecture, and AI-assisted work.
- The assignment's Persian demonstration video has not been recorded or attached.
- Remaining test opportunities are member assignment/deletion HTTP edge cases, concurrency, and malformed-document integration cases. Required authorization scenarios and manager/owner CRUD paths are automated and passing.
