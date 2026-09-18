import { z } from "zod";

export const AVAILABILITY_HORIZON_DAYS = 60;
export const AVAILABILITY_STALE_MS = 20 * 60 * 60 * 1000;

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const icalSettingsSchema = z.object({
  icalUrl: z
    .string()
    .trim()
    .url("Must be a valid URL (https://... or http://...)"),
});

const dayHoursEntrySchema = z
  .object({
    day: z.number().int().min(0).max(6),
    start: z.string().regex(TIME_REGEX, "Format must be HH:MM"),
    end: z.string().regex(TIME_REGEX, "Format must be HH:MM"),
  })
  .refine((data) => data.end > data.start, {
    message: "End time must be after start time",
  });

export const workingHoursSchema = z
  .object({
    days: z
      .array(z.number().min(0).max(6))
      .min(1, "Select at least one day of the week"),
    start: z.string().regex(TIME_REGEX, "Format must be HH:MM"),
    end: z.string().regex(TIME_REGEX, "Format must be HH:MM"),
    // Per-weekday working hours. When present for a day it takes precedence
    // over the shared `start`/`end` fallback (which remains for legacy rows).
    dayHours: z.array(dayHoursEntrySchema).optional().default([]),
    slotDurationMinutes: z.number().int().min(15).max(240).default(60),
    bufferMinutes: z.number().int().min(0).max(120).default(0),
    overrides: z
      .array(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          isBlocked: z.boolean().optional(),
          start: z.string().regex(TIME_REGEX).optional(),
          end: z.string().regex(TIME_REGEX).optional(),
        }),
      )
      .optional()
      .default([]),
    blockedRanges: z
      .array(
        z.object({
          id: z.string(),
          startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          reason: z.string().optional(),
        }),
      )
      .optional()
      .default([]),
  })
  .refine((data) => data.end > data.start, {
    message: "End time must be after start time",
  });

export type WorkingHoursInput = z.infer<typeof workingHoursSchema>;

/**
 * Loose shape accepted by the resolver so legacy JSON columns (which may lack
 * `dayHours`) and un-parsed DB rows can be passed without casting.
 */
export interface WorkingHoursLike {
  days?: number[] | null;
  start?: string | null;
  end?: string | null;
  dayHours?: { day: number; start: string; end: string }[] | null;
  overrides?:
    | {
        date: string;
        isBlocked?: boolean;
        start?: string;
        end?: string;
      }[]
    | null;
  blockedRanges?:
    | { id: string; startDate: string; endDate: string; reason?: string }[]
    | null;
}

export interface WorkingWindow {
  start: string;
  end: string;
}

function formatYmdLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Resolves the working window for a specific local date.
 *
 * Precedence: blocked range → full-day block override → custom-hours override
 * → per-day hours (`dayHours`) → shared fallback (`days` + `start`/`end`).
 * Returns `null` when the date is not a working day.
 */
export function resolveWorkingWindow(
  workingHours: WorkingHoursLike | null | undefined,
  date: Date,
): WorkingWindow | null {
  if (!workingHours) return null;

  const hasDayHours =
    Array.isArray(workingHours.dayHours) && workingHours.dayHours.length > 0;
  const hasLegacyDays =
    Array.isArray(workingHours.days) && workingHours.days.length > 0;

  if (!hasDayHours && !hasLegacyDays) return null;

  const dateStr = formatYmdLocal(date);

  const isRangeBlocked = (workingHours.blockedRanges ?? []).some(
    (range) => dateStr >= range.startDate && dateStr <= range.endDate,
  );
  if (isRangeBlocked) return null;

  const override = (workingHours.overrides ?? []).find(
    (o) => o.date === dateStr,
  );
  if (override?.isBlocked) return null;
  if (override?.start && override?.end) {
    return { start: override.start, end: override.end };
  }

  const dayHoursEntry = (workingHours.dayHours ?? []).find(
    (d) => d.day === date.getDay(),
  );
  if (dayHoursEntry) {
    return { start: dayHoursEntry.start, end: dayHoursEntry.end };
  }

  if (hasLegacyDays && workingHours.days!.includes(date.getDay())) {
    if (!workingHours.start || !workingHours.end) return null;
    return { start: workingHours.start, end: workingHours.end };
  }

  return null;
}

export const DEFAULT_WORKING_HOURS: WorkingHoursInput = {
  days: [1, 2, 3, 4], // Monday, Tuesday, Wednesday, Thursday
  start: "10:00",
  end: "14:00",
  dayHours: [1, 2, 3, 4].map((day) => ({ day, start: "10:00", end: "14:00" })),
  slotDurationMinutes: 60,
  bufferMinutes: 0,
  overrides: [],
  blockedRanges: [],
};
