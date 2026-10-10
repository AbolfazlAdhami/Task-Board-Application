# Implementation plan

Phases should be completed in order. At the end of each phase, review the changed files and record the checks that actually ran.

## Phase 0 — Requirements and working agreement
- Record project instructions in `AGENTS.md`.
- Translate the assignment requirements into implementation phases.
- Resolve ambiguities before making architectural decisions.

## Phase 1 — Monorepo foundation
- Establish `frontend/`, `backend/`, `docs/`, and AI guidance areas.
- Add root scripts, environment example, and PostgreSQL Compose service.
- Review package scripts, environment loading, and the Next.js API proxy.
- Install dependencies, create a lockfile, and build both applications.

## Phase 2 — Database model, migrations, and seed
- Implement user and task entities.
- Create reversible migrations; keep `synchronize: false`.
- Create an idempotent seed for one Owner, one Manager, and one Member.
- Verify migration and seed behavior against PostgreSQL.

## Phase 3 — Authentication and sessions
- Implement login, logout, refresh rotation, and `/auth/me`.
- Use HttpOnly cookies and store only a refresh-token hash.
- Ensure a disabled user’s existing sessions stop working.

## Phase 4 — Roles and user administration
- Enforce Owner, Manager, and Member permissions inside NestJS.
- Protect the last active Owner from disablement or role downgrade.
- Add tests for forbidden user administration and last-owner protection.

## Phase 5 — Task API and TipTap JSON
- Implement task CRUD and role-based visibility.
- Validate supported TipTap JSON nodes, marks, and HTTP/HTTPS links.
- Test access, assignment, update, and deletion rules.

## Phase 6 — Persian RTL frontend
- Implement the Persian RTL task board.
- Use Headless UI Dialog, Listbox, and Menu.
- Add filters and a TipTap editor and read-only view.
- Check keyboard navigation and role-specific workflows.

## Phase 7 — Security and automated verification
- Run unit, integration, and build checks.
- Close security gaps and record actual results.

## Phase 8 — Delivery
- Complete the README, including setup, migrations, seed, credentials, decisions, and limitations.
- Document AI use and review practices.
- Record the Persian screen demo, up to five minutes.
- Deliver the source repository.