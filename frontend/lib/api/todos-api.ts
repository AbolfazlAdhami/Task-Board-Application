import { api } from "./client";
import type { TiptapDocument } from "./tiptap-document";

export type TodoStatus = "todo" | "in_progress" | "done";
export type TodoPriority = "low" | "medium" | "high";

export type TodoInput = Pick<Todo, "title" | "status" | "priority" | "dueDate" | "description" | "assignedTo">;

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
  async create(input: TodoInput): Promise<Todo> {
    const response = await api.post<Todo>("/todos", input);
    return response.data;
  },

  async update(id: string, input: Partial<TodoInput>): Promise<Todo> {
    const response = await api.patch<Todo>(`/todos/${id}`, input);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/todos/${id}`);
  },
};
