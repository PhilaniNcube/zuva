"use server";

import { refresh } from "next/cache";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import { availabilitySlot, coachProfile } from "@/lib/db/schema";
import { fetchIcalCalendarSlots, type CalendarSlot } from "@/lib/ical-parser";
import { requireRole } from "@/lib/rbac";
import { getCoachProfile } from "./coach-queries";

const icalSettingsSchema = z.object({
  icalUrl: z
    .string()
    .trim()
    .url("Must be a valid URL (https://... or http://...)"),
});

export async function saveCoachIcalUrl(
  input: unknown,
): Promise<ActionResult<{ slotsCreated: number }>> {
  const { user: coach } = await requireRole("coach");
  const parsed = icalSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { icalUrl } = parsed.data;

  await db
    .update(coachProfile)
    .set({ icalUrl })
    .where(eq(coachProfile.userId, coach.id));

  // Trigger sync immediately with new settings
  const syncResult = await syncCoachAvailability();

  refresh();
  return syncResult;
}

export async function syncCoachAvailability(): Promise<ActionResult<{ slotsCreated: number }>> {
  const { user: coach } = await requireRole("coach");
  const profile = await getCoachProfile(coach.id);

  if (!profile || !profile.icalUrl) {
    return {
      ok: false,
      error: "Please enter your calendar iCal feed URL first.",
    };
  }

  let calendarSlots: CalendarSlot[] = [];
  try {
    calendarSlots = await fetchIcalCalendarSlots(profile.icalUrl);
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to fetch iCal feed";
    return { ok: false, error: errorMsg };
  }

  const now = new Date();
  const horizonDays = 60;
  const horizonEnd = new Date();
  horizonEnd.setDate(now.getDate() + horizonDays);

  // Filter for events tagged as ZUVA slots (or containing "zuva" / "#zuva" / "coaching")
  const zuvaSlots = calendarSlots.filter(
    (slot) => slot.isZuvaSlot && slot.start.getTime() > now.getTime(),
  );

  // Fetch existing open & booked slots for this coach in horizon to avoid duplication
  const existingSlots = await db
    .select({
      startsAt: availabilitySlot.startsAt,
      endsAt: availabilitySlot.endsAt,
    })
    .from(availabilitySlot)
    .where(
      and(
        eq(availabilitySlot.coachId, coach.id),
        gte(availabilitySlot.startsAt, now),
        lte(availabilitySlot.endsAt, horizonEnd),
      ),
    );

  const candidateSlotsToInsert: { coachId: string; startsAt: Date; endsAt: Date }[] = [];

  for (const slot of zuvaSlots) {
    const overlapsWithExisting = existingSlots.some(
      (existing) =>
        slot.start.getTime() < existing.endsAt.getTime() &&
        slot.end.getTime() > existing.startsAt.getTime(),
    );

    if (!overlapsWithExisting) {
      candidateSlotsToInsert.push({
        coachId: coach.id,
        startsAt: slot.start,
        endsAt: slot.end,
      });
    }
  }

  if (candidateSlotsToInsert.length > 0) {
    await db.insert(availabilitySlot).values(candidateSlotsToInsert);
  }

  await db
    .update(coachProfile)
    .set({ lastSyncedAt: new Date() })
    .where(eq(coachProfile.userId, coach.id));

  refresh();

  return {
    ok: true,
    data: { slotsCreated: candidateSlotsToInsert.length },
  };
}

// Keep saveCoachIcalSettings alias for backwards compatibility
export const saveCoachIcalSettings = saveCoachIcalUrl;
