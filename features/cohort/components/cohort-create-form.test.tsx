import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CohortCreateForm } from "./cohort-create-form";

vi.mock("../cohort-actions", () => ({
  createCohort: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("CohortCreateForm", () => {
  it("renders the Create Cohort trigger button", () => {
    render(<CohortCreateForm />);

    expect(
      screen.getByRole("button", { name: /Create Cohort/i })
    ).toBeInTheDocument();
  });

  it("opens dialog with form fields on trigger click", async () => {
    const user = userEvent.setup();
    render(<CohortCreateForm />);

    await user.click(screen.getByRole("button", { name: /Create Cohort/i }));

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Starts")).toBeInTheDocument();
    expect(screen.getByText(/Ends/)).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });
});
