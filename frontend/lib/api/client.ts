import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

type RetryConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
};

export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

let refreshInFlight: Promise<void> | null = null;

api.interceptors.request.use((config) => {
  config.withCredentials = true;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const url = original?.url ?? "";
    const isAuthEndpoint = /^\/auth\/(login|refresh|logout)$/.test(url);

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retried ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      refreshInFlight ??= axios
        .post("/api/v1/auth/refresh", undefined, { withCredentials: true })
        .then(() => undefined)
        .finally(() => {
          refreshInFlight = null;
        });

      await refreshInFlight;
      return api.request(original);
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("task-board:unauthorized"));
      }

      return Promise.reject(refreshError);
    }
  },
);
