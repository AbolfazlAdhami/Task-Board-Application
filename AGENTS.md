# Project instructions for AI agents

## Mission
Build the Task Board described in the hiring assignment. Treat the assignment document as the product requirements; treat the user's messages as the instructions for workflow, priorities, and decisions.

## Work style
- Develop in small, reviewable steps, following `docs/IMPLEMENTATION_PLAN.md` in order.
- Before each change, inspect the relevant files and their current state.
- Do not replace working areas wholesale to match a preferred scaffold.
- Complete one phase at a time. At phase boundaries, report changes, checks actually run, and the next step.
- Preserve existing work. Never delete or reset project files without explicit direction.
- Keep `frontend/` and `backend/` responsibilities separate.
- Browser requests must stay on the Next.js origin. Next.js proxies `/api/v1/*` to NestJS.

## Architecture and security requirements
- Frontend: Next.js App Router, TypeScript, Tailwind CSS, Headless UI, and TipTap.
- Backend: NestJS, TypeORM, PostgreSQL, and Docker Compose.
- Keep TypeORM `synchronize` disabled. Database changes must use reviewed migrations.
- Store access and refresh tokens only in HttpOnly cookies.
- Store only a hash of refresh tokens in PostgreSQL.
- Disabled users must lose access immediately, including with previously issued access tokens.
- Enforce authorization in NestJS, never only in the UI.
- Respect Owner, Manager, and Member permissions in the assignment.
- Protect the last active Owner from disablement or downgrade.
- Validate DTOs and reject unknown fields.
- Treat TipTap JSON as untrusted input. Allow only supported nodes and marks, and HTTP/HTTPS links.
- Store TipTap JSON as the source of truth and render from that JSON.
- Never log or commit passwords, secrets, raw tokens, or real user data.

## Quality and documentation
- Add automated tests for the assignment's required security cases.
- Document setup, environment variables, migrations, seed behavior, sample accounts, architecture decisions, known limitations, and AI assistance in `README.md`.
- Do not claim generated code has been reviewed or verified unless that work happened.
- Before finishing a phase, inspect the changed files and run the relevant available checks.
- If dependencies or tools are unavailable, record the limitation and leave verification marked incomplete.