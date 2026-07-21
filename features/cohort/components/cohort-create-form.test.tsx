import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CohortCreateForm } from "./cohort-create-form";

vi.mock("../cohort-actions", () => ({
  createCohort: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("CohortCreateForm", () => {
  it("renders all form fields", () => {
    render(<CohortCreateForm />);

    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Starts/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ends/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    render(<CohortCreateForm />);

    expect(
      screen.getByRole("button", { name: /Create cohort/ }),
    ).toBeInTheDocument();
  });

  it("has a name input with placeholder", () => {
    render(<CohortCreateForm />);

    expect(
      screen.getByPlaceholderText("2026 Intake 2"),
    ).toBeInTheDocument();
  });

  it("has date inputs for starts and ends", () => {
    render(<CohortCreateForm />);

    const startsInput = screen.getByLabelText(/Starts/);
    const endsInput = screen.getByLabelText(/Ends/);
    expect(startsInput).toHaveAttribute("type", "date");
    expect(endsInput).toHaveAttribute("type", "date");
  });
});
