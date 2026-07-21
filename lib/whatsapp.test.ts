import { describe, expect, it } from "vitest";

import { sessionContactMessage, waLink } from "./whatsapp";

describe("waLink", () => {
  it("builds a wa.me deep link with normalized phone and encoded message", () => {
    const url = waLink("+233 20 000 0001", "Hello world");
    expect(url).toBe(
      "https://wa.me/233200000001?text=Hello%20world",
    );
  });

  it("strips all non-digit characters from the phone number", () => {
    const url = waLink("+1 (555) 123-4567", "test");
    expect(url).toContain("wa.me/15551234567");
  });

  it("encodes special characters in the message", () => {
    const url = waLink("123", "Hello & goodbye <>");
    expect(url).toContain(encodeURIComponent("Hello & goodbye <>"));
  });
});

describe("sessionContactMessage", () => {
  it("includes scholar name, session title, and UTC time", () => {
    const msg = sessionContactMessage({
      scholarName: "Tendai",
      sessionTitle: "Academic Writing Masterclass",
      startsAt: new Date("2026-03-15T14:00:00Z"),
    });
    expect(msg).toContain("Tendai");
    expect(msg).toContain("Academic Writing Masterclass");
    expect(msg).toContain("UTC");
  });

  it("returns a string that can be URL-encoded", () => {
    const msg = sessionContactMessage({
      scholarName: "Amina",
      sessionTitle: "Session & Q&A",
      startsAt: new Date(),
    });
    expect(() => encodeURIComponent(msg)).not.toThrow();
  });
});
