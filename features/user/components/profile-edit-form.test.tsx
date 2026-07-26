import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProfileEditForm } from "./profile-edit-form";

// Mock user actions
vi.mock("../user-actions", () => ({
  updateProfileDetails: vi.fn(),
  changeUserPassword: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUser = {
  id: "u1",
  name: "Jane Scholar",
  email: "jane@zuva.test",
  role: "scholar" as const,
};

describe("ProfileEditForm", () => {
  it("renders personal details tab by default", () => {
    render(<ProfileEditForm user={mockUser} />);

    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jane Scholar")).toBeInTheDocument();
    expect(screen.getByDisplayValue("jane@zuva.test")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Save Details/i })).toBeInTheDocument();
  });

  it("switches to Security & Password tab", async () => {
    const user = userEvent.setup();
    render(<ProfileEditForm user={mockUser} />);

    const securityTab = screen.getByRole("tab", { name: /Security & Password/i });
    await user.click(securityTab);

    expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Update Password/i })).toBeInTheDocument();
  });

  it("displays validation error on form submission when password is too short", async () => {
    const user = userEvent.setup();
    render(<ProfileEditForm user={mockUser} />);

    // Switch to Security tab
    await user.click(screen.getByRole("tab", { name: /Security & Password/i }));

    const updateBtn = screen.getByRole("button", { name: /Update Password/i });

    // Type current password and short new password
    await user.type(screen.getByLabelText("Current Password"), "password123");
    await user.type(screen.getByLabelText("New Password"), "short");
    await user.type(screen.getByLabelText("Confirm New Password"), "short");

    await user.click(updateBtn);

    expect(await screen.findByText("New password must be at least 8 characters")).toBeInTheDocument();
  });
});
