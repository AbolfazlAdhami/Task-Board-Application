# Architecture Decisions

## Workspace and runtime

- Use npm workspaces for the `frontend` and `backend` applications.
- Require Node.js 24.15 or newer. The assignment permits Node.js 20+, but the project uses a newer baseline compatible with the current NestJS CLI.

## Local application ports

- Next.js frontend: `http://localhost:3000`
- NestJS backend: `http://localhost:3001`
- The root `npm run dev` command starts both applications together.
- The browser will call Next.js only; Next.js will proxy API calls to NestJS.

PostgreSQL Compose configuration and database startup instructions will be recorded when that setup is added.
