# Authentication

## Scope

Implement registration, login, logout, and refresh-session rotation.

## Requirements

- Registration requires a unique email and a password stored only as a secure hash.
- New users receive the `member` role by default.
- Login rejects invalid credentials and inactive users.
- Access tokens are short-lived and sent in an HttpOnly cookie.
- Refresh tokens are stored only as hashes in the database and belong to a token family.
- Refresh rotation revokes the prior token. Reuse of a revoked token revokes its family.
- Logout revokes the active refresh token.

## Verification

- Test successful and rejected registration and login.
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
