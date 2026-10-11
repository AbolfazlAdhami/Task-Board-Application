# Task Board Project Skill

Before each microstep, read `AGENTS.md`, this skill, and the relevant section of `docs/IMPLEMENTATION_PLAN.md`.

## Microstep workflow

1. State the goal, files to change, acceptance criteria, and test type before making a change.
2. Make one small, reviewable change at a time.
3. Update documentation and checklists only when the work is actually complete.
4. Report commands run, results, and any unverified items honestly.
5. Do not implement a later phase until the current microstep is reviewed.

## Architecture and security invariants

- Browser requests go only to Next.js; Next.js proxies `/api/v1/*` to NestJS.
- NestJS is authoritative for authentication, role checks, task ownership, validation, and persistence.
- TypeORM `synchronize` stays disabled; schema changes use migrations.
- Access tokens use HttpOnly cookies; persist refresh tokens only as hashes.
- Disabled users cannot log in or continue using existing sessions.
- Prevent disabling or demoting the last active owner.
- Validate TipTap JSON server-side and allow links only with `http` or `https`.
- Keep Persian UI and RTL layout; use the required Headless UI components.

## Test-type guide

- Documentation/configuration microsteps: path/reference checks, format checks, and configuration parsing; no application test is needed.
- Pure backend logic and validators: unit tests.
- NestJS modules, TypeORM mappings, migrations, and database behavior: integration tests with PostgreSQL.
- Authentication, authorization, cookies, proxy behavior, and required security scenarios: HTTP end-to-end tests.
- Frontend interactions: component tests; keyboard/focus behavior gets accessibility checks; production readiness gets a build check.
- State which test type applies before each step. Do not mark checks complete until they actually pass.
