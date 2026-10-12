import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { DashboardShell } from "./dashboard-shell";
import { authApi } from "@/lib/api/auth-api";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

const mockReplace = jest.fn();

const appRouter = {
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  hmrRefresh: jest.fn(),
  push: jest.fn(),
  replace: mockReplace,
  prefetch: jest.fn(),
  experimental_gesturePush: jest.fn(),
} as unknown as AppRouterInstance;

function renderDashboard(children: ReactNode) {
  return render(
    <AppRouterContext.Provider value={appRouter}>
      <PathnameContext.Provider value="/">
        <DashboardShell>{children}</DashboardShell>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );
}

describe("DashboardShell session guard", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }),
    });
  });

  it("redirects to login when the current session is missing or invalid", async () => {
    jest.spyOn(authApi, "me").mockRejectedValue(new Error("Unauthorized"));

    renderDashboard(<p>dashboard private content</p>);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
    expect(
      screen.queryByText("dashboard private content"),
    ).not.toBeInTheDocument();
  });

  it("redirects when a later refresh failure announces an unauthorized session", async () => {
    jest.spyOn(authApi, "me").mockResolvedValue({
      userId: "user-1",
      name: "Test User",
      email: "test@example.com",
      role: "member",
    });

    renderDashboard(<p>dashboard private content</p>);

    expect(await screen.findByText("dashboard private content")).toBeVisible();
    window.dispatchEvent(new Event("task-board:unauthorized"));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
  });
});
