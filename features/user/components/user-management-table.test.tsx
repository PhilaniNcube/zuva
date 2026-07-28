import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UserManagementTable } from "./user-management-table";

// Mock user actions
vi.mock("../user-actions", () => ({
  promoteUserToAdmin: vi.fn(),
  deleteUser: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUsers = [
  {
    id: "admin-1",
    name: "Admin Amara",
    email: "admin@zuva.test",
    role: "admin" as const,
    image: null,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "scholar-1",
    name: "Scholar Tendai",
    email: "scholar@zuva.test",
    role: "scholar" as const,
    image: null,
    createdAt: new Date("2026-01-15"),
  },
  {
    id: "coach-1",
    name: "Coach Kofi",
    email: "coach@zuva.test",
    role: "coach" as const,
    image: null,
    createdAt: new Date("2026-02-01"),
  },
];

describe("UserManagementTable", () => {
  it("renders user table with names, emails, and role badges", () => {
    render(<UserManagementTable users={mockUsers} currentUserId="admin-1" />);

    expect(screen.getByText("Admin Amara (You)")).toBeInTheDocument();
    expect(screen.getByText("Scholar Tendai")).toBeInTheDocument();
    expect(screen.getByText("Coach Kofi")).toBeInTheDocument();
    expect(screen.getByText("scholar@zuva.test")).toBeInTheDocument();
  });

  it("filters users when searching", async () => {
    const user = userEvent.setup();
    render(<UserManagementTable users={mockUsers} currentUserId="admin-1" />);

    const searchInput = screen.getByPlaceholderText(/Search by name/i);
    await user.type(searchInput, "Tendai");

    expect(screen.getByText("Scholar Tendai")).toBeInTheDocument();
    expect(screen.queryByText("Coach Kofi")).not.toBeInTheDocument();
  });

  it("disables Promote to Admin button for scholar users and enables it for coaches", async () => {
    const user = userEvent.setup();
    render(<UserManagementTable users={mockUsers} currentUserId="admin-1" />);

    const promoteButtons = screen.getAllByRole("button", { name: /Promote to Admin/i });
    expect(promoteButtons.length).toBe(2);

    // Scholar button is disabled
    expect(promoteButtons[0]).toBeDisabled();

    // Coach button is enabled and opens confirmation dialog
    expect(promoteButtons[1]).toBeEnabled();
    await user.click(promoteButtons[1]);

    expect(screen.getByText("Confirm Admin Promotion")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Promote User" })).toBeInTheDocument();
  });

  it("renders delete buttons for non-self users and opens Delete User Account dialog", async () => {
    const user = userEvent.setup();
    render(<UserManagementTable users={mockUsers} currentUserId="admin-1" />);

    const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
    expect(deleteButtons.length).toBe(2); // Scholar Tendai & Coach Kofi, not self (Admin Amara)

    await user.click(deleteButtons[0]);

    expect(screen.getByText("Delete User Account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Account" })).toBeInTheDocument();
  });
});

