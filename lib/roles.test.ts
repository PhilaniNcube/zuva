import { describe, expect, it } from "vitest";

import { ROLE_HOME, ROLES, roleHome } from "./roles";

describe("ROLES", () => {
  it("contains all four roles", () => {
    expect(ROLES).toEqual(["scholar", "coach", "admin", "minds"]);
  });
});

describe("ROLE_HOME", () => {
  it("maps every role to a home path", () => {
    for (const role of ROLES) {
      expect(ROLE_HOME[role]).toMatch(/^\//);
    }
  });

  it("scholar goes to /pathway", () => {
    expect(ROLE_HOME.scholar).toBe("/pathway");
  });

  it("admin goes to /dashboard", () => {
    expect(ROLE_HOME.admin).toBe("/dashboard");
  });
});

describe("roleHome", () => {
  it("returns the correct home for each role", () => {
    expect(roleHome("scholar")).toBe("/pathway");
    expect(roleHome("coach")).toBe("/availability");
    expect(roleHome("admin")).toBe("/dashboard");
    expect(roleHome("minds")).toBe("/approvals");
  });

  it("falls back to scholar home for unknown roles", () => {
    expect(roleHome("unknown")).toBe("/pathway");
    expect(roleHome("")).toBe("/pathway");
  });
});
