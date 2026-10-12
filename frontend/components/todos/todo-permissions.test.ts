import { describe, expect, it } from "@jest/globals";
import type { CurrentUser } from "../../lib/api/auth-api";
import type { Todo } from "../../lib/api/todos-api";
import { canEditTodo } from "./todo-permissions";

const todo: Todo = {
  id: "task-1",
  title: "وظیفهٔ آزمایشی",
  status: "todo",
  priority: "medium",
  dueDate: null,
  description: { type: "doc", content: [] },
  createdBy: "creator-1",
  assignedTo: "assignee-1",
  createdAt: "2026-10-12T08:00:00.000Z",
  updatedAt: "2026-10-12T08:00:00.000Z",
};

function user(userId: string, role: CurrentUser["role"]): CurrentUser {
  return {
    userId,
    name: "کاربر آزمایشی",
    email: `${role}@example.test`,
    role,
  };
}

describe("task edit and drag permissions", () => {
  it.each(["owner", "manager"] as const)(
    "%s can edit and drag any task",
    (role) => {
      expect(canEditTodo(todo, user("unrelated-user", role))).toBe(true);
    },
  );

  it("lets a member edit and drag tasks they created", () => {
    expect(canEditTodo(todo, user("creator-1", "member"))).toBe(true);
  });

  it("lets a member edit and drag tasks assigned to them", () => {
    expect(canEditTodo(todo, user("assignee-1", "member"))).toBe(true);
  });

  it("prevents a member from editing or dragging another user's task", () => {
    expect(canEditTodo(todo, user("unrelated-user", "member"))).toBe(false);
  });

  it("does not enable editing or dragging before the session is loaded", () => {
    expect(canEditTodo(todo, null)).toBe(false);
  });
});
