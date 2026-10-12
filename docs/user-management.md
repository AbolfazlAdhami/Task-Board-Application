# User management

## API and permissions

- `GET /api/v1/users` is available to owners and managers. Members are denied.
- `POST /api/v1/users` and `PATCH /api/v1/users/:id` are owner-only.
- New accounts are active by default. Passwords are hashed by the backend with bcrypt.
- Owners can update a user's display name, email, role, and active state.
- The backend blocks disabling or downgrading the last active owner. The UI displays this API conflict in Persian.
- Disabling a user prevents future login and rejects existing access sessions.
- Authorization is enforced by NestJS; hiding controls in the UI is only a usability measure.

## Frontend user directory

The Persian RTL directory is at `/users` and uses the Next.js `/api/v1/*` proxy through the shared Axios client.

- Owners can search by name or email, filter by role and active state, add an account, and edit account fields, role, or activation.
- Managers can inspect the directory and use its search/filters, but do not see mutation controls.
- Members do not see the directory navigation, and the backend rejects member requests to `GET /users`.
- The create/edit form uses a Headless UI Dialog and role selection uses a Headless UI Listbox. The dialog has labelled inputs, inline validation, pending/error states, and Headless UI focus management.
- An inactive account is visibly marked; the edit form explains that disabling it also blocks its sessions.
- The table includes summary counts, localized dates, and empty/loading/error states.

## Verification

- `npx tsc --noEmit -p frontend/tsconfig.json` passed after the user-management changes.
- `npm run lint --workspace=frontend` passed with 0 errors and one pre-existing warning in `frontend/lib/api/client.ts` about `window.location.assign()`.
- `npm run build --workspace=frontend -- --webpack` is blocked in this environment because DNS cannot resolve `fonts.googleapis.com` for the configured Vazirmatn `next/font` download. The build did not reach application compilation.
- There is currently no frontend component-test or automated browser-test setup. Keyboard and screen-reader behavior still needs a manual accessibility pass before Stage 6 is marked complete.
- Backend role enforcement and last-active-owner behavior remain authoritative and are covered in the backend requirements audit.
