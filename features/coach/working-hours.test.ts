import { describe, expect, it } from "vitest";

import {
  DEFAULT_WORKING_HOURS,
  resolveWorkingWindow,
  workingHoursSchema,
  type WorkingHoursInput,
} from "./working-hours";

function localDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const base: WorkingHoursInput = {
  days: [1, 2, 3, 4],
  start: "10:00",
  end: "14:00",
  dayHours: [],
  slotDurationMinutes: 60,
  bufferMinutes: 0,
  overrides: [],
  blockedRanges: [],
};

describe("resolveWorkingWindow", () => {
  it("falls back to shared days + start/end for legacy rows", () => {
    // 2026-09-21 is a Monday
    expect(resolveWorkingWindow(base, localDate("2026-09-21"))).toEqual({
      start: "10:00",
      end: "14:00",
    });
    // Saturday is not an active day
    expect(resolveWorkingWindow(base, localDate("2026-09-26"))).toBeNull();
  });

  it("prefers per-day hours when present", () => {
    const wh: WorkingHoursInput = {
      ...base,
      dayHours: [
        { day: 1, start: "09:00", end: "12:00" },
        { day: 2, start: "10:00", end: "14:00" },
      ],
    };
    expect(resolveWorkingWindow(wh, localDate("2026-09-21"))).toEqual({
      start: "09:00",
      end: "12:00",
    });
    expect(resolveWorkingWindow(wh, localDate("2026-09-22"))).toEqual({
      start: "10:00",
      end: "14:00",
    });
    // Tuesday has per-day hours, Wednesday/Thursday fall back to the shared window
    expect(resolveWorkingWindow(wh, localDate("2026-09-23"))).toEqual({
      start: "10:00",
      end: "14:00",
    });
  });

  it("treats a day as active when only dayHours includes it", () => {
    const wh: WorkingHoursInput = {
      ...base,
      days: [],
      dayHours: [{ day: 1, start: "09:00", end: "11:00" }],
    };
    expect(resolveWorkingWindow(wh, localDate("2026-09-21"))).toEqual({
      start: "09:00",
      end: "11:00",
    });
    expect(resolveWorkingWindow(wh, localDate("2026-09-22"))).toBeNull();
  });

  it("honours custom-hours date overrides over per-day hours", () => {
    const wh: WorkingHoursInput = {
      ...base,
      dayHours: [{ day: 1, start: "09:00", end: "12:00" }],
      overrides: [
        { date: "2026-09-21", isBlocked: false, start: "15:00", end: "17:00" },
      ],
    };
    expect(resolveWorkingWindow(wh, localDate("2026-09-21"))).toEqual({
      start: "15:00",
      end: "17:00",
    });
  });

  it("returns null for a blocked-date override", () => {
    const wh: WorkingHoursInput = {
      ...base,
      overrides: [{ date: "2026-09-21", isBlocked: true }],
    };
    expect(resolveWorkingWindow(wh, localDate("2026-09-21"))).toBeNull();
  });

  it("returns null inside a blocked range", () => {
    const wh: WorkingHoursInput = {
      ...base,
      blockedRanges: [
        {
          id: "r1",
          startDate: "2026-09-21",
          endDate: "2026-09-25",
          reason: "Leave",
        },
      ],
    };
    expect(resolveWorkingWindow(wh, localDate("2026-09-22"))).toBeNull();
    expect(resolveWorkingWindow(wh, localDate("2026-09-28"))).toEqual({
      start: "10:00",
      end: "14:00",
    });
  });

  it("returns null when working hours are missing or empty", () => {
    expect(resolveWorkingWindow(null, localDate("2026-09-21"))).toBeNull();
    expect(resolveWorkingWindow(undefined, localDate("2026-09-21"))).toBeNull();
    expect(
      resolveWorkingWindow({ days: [], dayHours: [] }, localDate("2026-09-21")),
    ).toBeNull();
  });
});

describe("workingHoursSchema", () => {
  it("accepts per-day hours", () => {
    const parsed = workingHoursSchema.safeParse({
      ...base,
      dayHours: [{ day: 1, start: "09:00", end: "17:00" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a per-day window whose end is not after start", () => {
    const parsed = workingHoursSchema.safeParse({
      ...base,
      dayHours: [{ day: 1, start: "17:00", end: "09:00" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("defaults dayHours to an empty array", () => {
    const parsed = workingHoursSchema.parse({
      days: [1],
      start: "10:00",
      end: "14:00",
    });
    expect(parsed.dayHours).toEqual([]);
  });

  it("DEFAULT_WORKING_HOURS is valid and self-consistent", () => {
    expect(workingHoursSchema.safeParse(DEFAULT_WORKING_HOURS).success).toBe(
      true,
    );
  });
});
