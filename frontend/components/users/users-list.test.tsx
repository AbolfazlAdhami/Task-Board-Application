import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { authApi } from "@/lib/api/auth-api";
import { usersApi, type UserSummary } from "@/lib/api/users-api";
import { UsersList } from "./users-list";

const sampleUser: UserSummary = {
  id: "member-1",
  email: "member@example.com",
  displayName: "عضو آزمایشی",
  role: "member",
  isActive: true,
  createdAt: "2026-10-12T08:00:00.000Z",
  updatedAt: "2026-10-12T08:00:00.000Z",
};

describe("UsersList role-aware interactions", () => {
  beforeEach(() => {
    jest.spyOn(usersApi, "list").mockResolvedValue([sampleUser]);
  });

  it("lets an owner open the user dialog and restores focus after Escape", async () => {
    jest.spyOn(authApi, "me").mockResolvedValue({
      userId: "owner-1",
      name: "مالک آزمایشی",
      email: "owner@example.com",
      role: "owner",
    });
    const user = userEvent.setup();

    render(<UsersList />);

    const addButton = await screen.findByRole("button", {
      name: "افزودن کاربر",
    });
    await user.click(addButton);
    expect(screen.getByRole("dialog")).toBeVisible();

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(addButton).toHaveFocus();
  });

  it("shows the directory to managers without owner-only mutation controls", async () => {
    jest.spyOn(authApi, "me").mockResolvedValue({
      userId: "manager-1",
      name: "مدیر آزمایشی",
      email: "manager@example.com",
      role: "manager",
    });

    render(<UsersList />);

    expect(await screen.findByText("عضو آزمایشی")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "افزودن کاربر" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "ویرایش کاربر عضو آزمایشی" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/فقط برای مشاهده/)).toBeVisible();
  });

  it("has no automated accessibility violations in its directory view", async () => {
    jest.spyOn(authApi, "me").mockResolvedValue({
      userId: "owner-1",
      name: "مالک آزمایشی",
      email: "owner@example.com",
      role: "owner",
    });

    const { container } = render(<UsersList />);
    await screen.findByText("عضو آزمایشی");

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
