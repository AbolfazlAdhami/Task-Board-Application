# Authentication

## Current implementation status

Public registration is intentionally disabled. Initial users are created through the database seed script; additional users are created by an authenticated owner. The API global prefix is `/api/v1`. Access cookies use `Path=/`; refresh cookies use `Path=/api/v1/auth` so the browser sends them to the refresh and logout endpoints.

## Verification status (2026-10-12)

- Backend build passed.
- Unit tests passed: 3 suites, 5 tests. Coverage includes member task visibility, owner-only user updates, and rejecting an inactive user in the JWT strategy.
- The e2e suite passed its single `GET /` smoke test. It does not yet exercise the auth endpoints through a signed-token HTTP flow.
- HTTPie Desktop checks for auth, user, and task routes were reported complete by the developer; detailed response codes were not recorded in this document.
- Lint passed with four warnings and no errors; see `backend-requirements-audit.md` for the warning list.

## Scope

Implement login, logout, refresh-session rotation, and the current-user endpoint.

## Requirements

- Public registration is disabled; initial accounts come from the seed script and user creation is owner-only.
- Created user passwords are stored only as bcrypt hashes.
- Login rejects invalid credentials and inactive users.
- Access tokens are short-lived and sent in an HttpOnly cookie.
- Refresh tokens are stored only as hashes in the database and belong to a token family.
- Refresh rotation revokes the prior token. Reuse of a revoked token revokes its family.
- Logout revokes the active refresh token.

## Verification

- Test successful and rejected login.
- Test that inactive users cannot log in.
- Test refresh rotation, expired or invalid refresh tokens, and token-family revocation.
- Test logout revocation and cookie behavior.

## Login and session creation

- Normalize email before lookup.
- Use the same generic unauthorized response for an unknown email or wrong password.
- Reject inactive users.
- On successful login, issue a short-lived access token and a refresh token.
- Send both tokens only in HttpOnly cookies; use Secure cookies in production.
- Store only the SHA-256 hash of the refresh token, with its user, family, and expiry.
- Never include password hashes or tokens in the response body.

### Verification

- Successful login sets both cookies and returns no token values in the body.
- Unknown email and wrong password both return `401`.
- Inactive user login returns `401`.

## Refresh and rotation

- Read the refresh JWT from the HttpOnly `refresh_token` cookie.
- Verify its signature and expiry with `JWT_REFRESH_SECRET`.
- Look up the stored row by SHA-256 hash; reject unknown or expired tokens.
- On successful refresh, revoke the current row and issue a new refresh token in the same family.
- Store only the new token's SHA-256 hash and update both auth cookies.
- If a previously revoked token is reused, revoke every active token in its family and reject the request.
- Reject refresh for inactive users.
- Make rotation atomic so concurrent requests cannot both reuse the same active token.

### Verification

- A valid refresh returns `200`, updates both cookies, and stores a new hash.
- The previous refresh token cannot be used again.
- Reuse of a revoked token revokes the active token in that family.
- Invalid, expired, and inactive-user refresh attempts are rejected.

## Logout

- `POST /auth/logout` clears both auth cookies.
- Revoke the active refresh-token family when a valid refresh cookie is present.
- Logout is idempotent: missing, invalid, or already revoked refresh cookies still result in cleared cookies and a successful response.
- Access tokens expire naturally; logout does not persist or return token values.

### Verification

- Logout clears both cookies.
- Refresh after logout is rejected.
- Repeating logout succeeds.

## Protecting API routes with access JWT

- Passport validates access JWTs from the `access_token` HttpOnly cookie.
- Use `JWT_ACCESS_SECRET` and reject invalid or expired tokens.
- Refresh tokens must never authenticate API requests.
- Attach the validated user (`userId`, `name`, `email`, `role`) to the request.
- Reject requests from inactive users, even when their access token is otherwise valid.
- Protect routes with a reusable `JwtAuthGuard`; public auth routes remain accessible.

### Verification

- A valid access cookie reaches a protected route.
- Missing, invalid, and expired access tokens return `401`.
- A refresh token cannot authenticate a protected route.
- An inactive user is rejected.

## Task authorization and ownership

- Owner has full task access and can manage users.
- Manager can create, edit, delete, and assign any task, but cannot manage users.
- Member can access tasks created by them or assigned to them.
- Members cannot assign tasks to other users or delete tasks created by other users.
- Task creator identity comes from the authenticated request (`request.user.userId`), never from client input.
- Authorization is enforced in NestJS services and guards.

### Verification

- Owner can access all tasks and user-management routes.
- Manager can manage and assign tasks but receives `403` for user-management routes.
- Member sees only created or assigned tasks.
- Member cannot assign another user or delete another user's task.
- Task creation records the authenticated user as creator.
