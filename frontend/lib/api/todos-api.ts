import { api } from "./client";
import type { TiptapDocument } from "./tiptap-document";

export type TodoStatus = "todo" | "in_progress" | "done";
export type TodoPriority = "low" | "medium" | "high";

export type Todo = {
  id: string;
  title: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: string | null;
  description: TiptapDocument;
  createdBy: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
};

export const todosApi = {
  async list(): Promise<Todo[]> {
    const response = await api.get<Todo[]>("/todos");
    return response.data;
  },
};
