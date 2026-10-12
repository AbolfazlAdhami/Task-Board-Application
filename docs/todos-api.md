# Todos API

The API base path is `/api/v1`. All task routes require a valid access JWT in the HttpOnly `access_token` cookie. Authorization is enforced by the NestJS API.

## Routes

| Method | Route | Behavior |
|---|---|---|
| `GET` | `/api/v1/todos` | Lists all tasks for owner/manager; lists only created or assigned tasks for member. |
| `POST` | `/api/v1/todos` | Creates a task; creator is taken from the authenticated user. |
| `GET` | `/api/v1/todos/:id` | Reads one task. A member who cannot access it receives `404`. |
| `PATCH` | `/api/v1/todos/:id` | Updates task fields. An empty update body is rejected. |
| `DELETE` | `/api/v1/todos/:id` | Deletes a task. Members can delete only tasks they created. |

Expected success statuses are `200` for GET/PATCH, `201` for POST, and `204` for DELETE.

## Task fields

| Field | Type | Rules |
|---|---|---|
| `title` | string | Required on create; 1–200 characters and cannot be whitespace-only. |
| `status` | string | `todo`, `in_progress`, or `done`; defaults to `todo`. |
| `priority` | string | `low`, `medium`, or `high`; defaults to `medium`. |
| `assignedTo` | UUID or `null` | Optional. Only owner/manager may assign another user, and the assignee must be active. |
| `dueDate` | date string or `null` | Optional; format `YYYY-MM-DD`. |
| `description` | TipTap JSON object | Optional; defaults to `{ "type": "doc", "content": [] }`. Stored as PostgreSQL `jsonb`. |

Example create body:

```json
{
  "title": "Prepare release notes",
  "status": "in_progress",
  "priority": "high",
  "assignedTo": "USER_UUID",
  "dueDate": "2026-11-01",
  "description": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Read the " },
          {
            "type": "text",
            "text": "release guide",
            "marks": [
              { "type": "link", "attrs": { "href": "https://example.com/guide" } }
            ]
          }
        ]
      }
    ]
  }
}
```

## TipTap JSON allow-list

- The root must be a `doc` with a `content` array. An empty array is valid.
- Supported block nodes: `paragraph`, `heading` (levels 1–6), `blockquote`, `bulletList`, `orderedList`, and `listItem`.
- Supported inline nodes: `text` and `hardBreak`.
- Supported marks: `bold`, `italic`, and `link`.
- Link `href` values must be absolute HTTP or HTTPS URLs. Schemes such as `javascript:` are rejected.
- Unknown node types, mark types, and attributes are rejected. API clients send JSON; HTML is not the stored source of truth.

## Role rules

- **Owner:** can read and manage every task.
- **Manager:** can create, read, update, delete, and assign any task to an active user.
- **Member:** can read tasks they created or that are assigned to them. They cannot assign tasks to another user and can delete only tasks they created.

The member-scoped list uses creator and assignee filters. A member requesting an inaccessible task by ID receives `404` to avoid revealing its existence. A member who can access a task because it is assigned to them but did not create it receives `403` when attempting deletion.

## Validation and persistence

The global Nest `ValidationPipe` enables `whitelist` and `forbidNonWhitelisted`; unknown request properties are rejected. DTOs validate status, priority, due date, assignee UUID, and the TipTap document structure. Task descriptions use `jsonb`; the `TodoRichContent` and `TodoDescriptionNotNull` migrations are applied.

## Verification record

On 2026-10-12 the developer reported completing the task API smoke checks in HTTPie Desktop. The backend unit suite passed (3 suites, 5 tests), the build passed, and the e2e suite passed its root `GET /` test. The e2e suite does not yet exercise task routes against PostgreSQL. Refer to `backend-requirements-audit.md` for current coverage and remaining work.

The frontend read-only renderer is still pending and must render the same TipTap JSON structure used by the API.
