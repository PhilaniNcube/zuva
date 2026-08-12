import { z } from "zod";

export const icalSettingsSchema = z.object({
  icalUrl: z
    .string()
    .trim()
    .url("Must be a valid URL (https://... or http://...)"),
});

export const workingHoursSchema = z
  .object({
    days: z
      .array(z.number().min(0).max(6))
      .min(1, "Select at least one day of the week"),
    start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format must be HH:MM"),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format must be HH:MM"),
    slotDurationMinutes: z.number().int().min(15).max(240).default(60),
    bufferMinutes: z.number().int().min(0).max(120).default(0),
    overrides: z
      .array(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          isBlocked: z.boolean().optional(),
          start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
          end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
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

export const DEFAULT_WORKING_HOURS: WorkingHoursInput = {
  days: [1, 2, 3, 4], // Monday, Tuesday, Wednesday, Thursday
  start: "10:00",
  end: "14:00",
  slotDurationMinutes: 60,
  bufferMinutes: 0,
  overrides: [],
  blockedRanges: [],
};
