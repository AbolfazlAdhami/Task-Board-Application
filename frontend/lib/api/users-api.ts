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

export const usersApi = {
  async list(): Promise<UserSummary[]> {
    const response = await api.get<UserSummary[]>("/users");
    return response.data;
  },
};
