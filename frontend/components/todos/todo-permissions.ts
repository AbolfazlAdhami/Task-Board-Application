import type { CurrentUser } from "../../lib/api/auth-api";
import type { Todo } from "../../lib/api/todos-api";

export function canEditTodo(todo: Todo, user: CurrentUser | null): boolean {
  if (!user) return false;
  if (user.role !== "member") return true;

  return todo.createdBy === user.userId || todo.assignedTo === user.userId;
}
