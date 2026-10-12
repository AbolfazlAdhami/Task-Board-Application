import { api } from "./client";
import type { UserRole } from "./auth-api";

export type UserSummary = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserInput = {
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
};

export type UpdateUserInput = Partial<
  Pick<UserSummary, "email" | "displayName" | "role" | "isActive">
>;

export const usersApi = {
  async list(): Promise<UserSummary[]> {
    const response = await api.get<UserSummary[]>("/users");
    return response.data;
  },

  async create(input: CreateUserInput): Promise<UserSummary> {
    const response = await api.post<UserSummary>("/users", input);
    return response.data;
  },

  async update(id: string, input: UpdateUserInput): Promise<UserSummary> {
    const response = await api.patch<UserSummary>(`/users/${id}`, input);
    return response.data;
  },
};
