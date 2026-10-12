# Architecture Decisions

## Workspace and runtime

- Use npm workspaces for the `frontend` and `backend` applications.
- Require Node.js 24.15 or newer. The assignment permits Node.js 20+, but the project uses a newer baseline compatible with the current NestJS CLI.

## Local application ports

- Next.js frontend: `http://localhost:3000`
- NestJS backend: `http://localhost:3001`
- The root `npm run dev` command starts both applications together.
- The browser calls Next.js only; Next.js proxies API calls to NestJS.
- PostgreSQL runs in Compose and is published on port `5433` by default.
- `GET /api/v1/health` is a public readiness check and pings PostgreSQL.

## Dashboard session guard

- Next.js `proxy.ts` checks for an access or refresh cookie on protected page routes and redirects requests with neither cookie to `/login`.
- Cookie presence is an optimistic navigation check only. `DashboardShell` verifies `/auth/me`; the NestJS JWT strategy reloads the user, rejects disabled accounts, and supplies the current database role for authorization.
- A refresh cookie is allowed through so the shared Axios client can call the refresh endpoint. If refresh fails, it emits an unauthorized event and the dashboard navigates to login.

## Persian font

- Bundle Vazirmatn from `@fontsource-variable/vazirmatn` and load it locally. Production builds do not fetch fonts from Google at build time.
- The font package is distributed under the SIL Open Font License.

## Backend browser CORS policy

- Allow credentialed browser requests only from `http://localhost:3000` in local development.
- Do not use a wildcard origin when cookies are enabled.
- CORS is enforced by browsers; it does not authenticate or block direct `curl` and server-to-server requests. Nest remains responsible for authentication and authorization.
- Browser code should continue to call the Next.js API proxy; the proxy's server-to-server calls are not restricted by browser CORS.

## Backend health endpoint

- Expose `GET /api/v1/health` as a public readiness check.
- A healthy response means the NestJS app can respond and PostgreSQL passes a TypeORM health ping.
- Return an unhealthy service response when the database check fails.
- Do not expose credentials, connection strings, or internal error details in the response.
- Exclude the probe from global rate limiting so routine health polling does not consume client request limits.
