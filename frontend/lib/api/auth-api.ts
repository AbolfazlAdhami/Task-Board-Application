import { api } from "./client";

export type UserRole = "owner" | "manager" | "member";

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};

export type CurrentUser = {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
};

export const authApi = {
  async login(input: LoginInput): Promise<LoginUser> {
    const response = await api.post<LoginUser>("/auth/login", input);
    return response.data;
  },

  async me(): Promise<CurrentUser> {
    const response = await api.get<CurrentUser>("/auth/me");
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
};
