"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, lte } from "drizzle-orm";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import {
  availabilitySlot,
  coachProfile,
  programmeSession,
} from "@/lib/db/schema";
import { fetchIcalCalendarSlots, type CalendarSlot } from "@/lib/ical-parser";
import { requireRole } from "@/lib/rbac";
import { getCoachProfile } from "./coach-queries";
import {
  DEFAULT_WORKING_HOURS,
  icalSettingsSchema,
  workingHoursSchema,
  type WorkingHoursInput,
} from "./working-hours";

/**
 * Calculates candidate free slots and syncs availabilitySlot DB records for a coach.
 * Incorporates:
 * 1. Coach working hours & recurring days
 * 2. Specific date overrides & vacation date ranges
 * 3. External iCal busy blocks
 * 4. Existing ZUVA sessions & bookings
 */
export async function syncCoachAvailabilityForUser(
  coachUserId: string,
): Promise<ActionResult<{ slotsCreated: number }>> {
  const profile = await getCoachProfile(coachUserId);

  if (!profile) {
    return { ok: false, error: "Coach profile not found" };
  }

  const workingHours: WorkingHoursInput =
    (profile.workingHours as WorkingHoursInput) || DEFAULT_WORKING_HOURS;

  // 1. Fetch external iCal busy blocks if URL configured
  let icalBusyBlocks: CalendarSlot[] = [];
  if (profile.icalUrl) {
    try {
      icalBusyBlocks = await fetchIcalCalendarSlots(profile.icalUrl);
    } catch {
      // Gracefully continue with internal calendar if iCal fetch fails
    }
  }

  const now = new Date();
  const horizonDays = 60;
  const horizonEnd = new Date();
  horizonEnd.setDate(now.getDate() + horizonDays);

  // 2. Fetch existing ZUVA programme sessions for this coach in horizon
  const coachSessions = await db
    .select({
      startsAt: programmeSession.startsAt,
      endsAt: programmeSession.endsAt,
    })
    .from(programmeSession)
    .where(
      and(
        eq(programmeSession.coachId, coachUserId),
        gte(programmeSession.startsAt, now),
        lte(programmeSession.endsAt, horizonEnd),
      ),
    );

  // 3. Fetch existing availability slots for this coach in horizon
  const existingSlots = await db
    .select({
      id: availabilitySlot.id,
      startsAt: availabilitySlot.startsAt,
      endsAt: availabilitySlot.endsAt,
      status: availabilitySlot.status,
    })
    .from(availabilitySlot)
    .where(
      and(
        eq(availabilitySlot.coachId, coachUserId),
        gte(availabilitySlot.startsAt, now),
        lte(availabilitySlot.endsAt, horizonEnd),
      ),
    );

  // Separate booked / cancelled slots (which act as blocks or preserved states)
  const bookedOrCancelledSlots = existingSlots.filter(
    (s) => s.status === "booked" || s.status === "cancelled",
  );

  // 4. Generate candidate free slots
  const candidateFreeSlots: { startsAt: Date; endsAt: Date }[] = [];

  const formatYmd = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const curr = new Date(now);
  curr.setHours(0, 0, 0, 0);

  const horizonEndMidnight = new Date(horizonEnd);
  horizonEndMidnight.setHours(23, 59, 59, 999);

  while (curr <= horizonEndMidnight) {
    const dateStr = formatYmd(curr);

    // Check if date falls in a blocked vacation range
    const isRangeBlocked = (workingHours.blockedRanges || []).some(
      (range) => dateStr >= range.startDate && dateStr <= range.endDate,
    );

    if (!isRangeBlocked) {
      const dateOverride = (workingHours.overrides || []).find(
        (o) => o.date === dateStr,
      );

      const isBlockedDay = dateOverride?.isBlocked === true;

      if (!isBlockedDay) {
        let activeStart = workingHours.start;
        let activeEnd = workingHours.end;
        let isWorkingDay = workingHours.days.includes(curr.getDay());

        if (dateOverride) {
          if (dateOverride.start && dateOverride.end) {
            activeStart = dateOverride.start;
            activeEnd = dateOverride.end;
            isWorkingDay = true;
          }
        }

        if (isWorkingDay) {
          const [sHour, sMin] = activeStart.split(":").map(Number);
          const [eHour, eMin] = activeEnd.split(":").map(Number);

          const dayStartTime = new Date(curr);
          dayStartTime.setHours(sHour, sMin, 0, 0);

          const dayEndTime = new Date(curr);
          dayEndTime.setHours(eHour, eMin, 0, 0);

          const slotDurationMs =
            (workingHours.slotDurationMinutes || 60) * 60 * 1000;
          const bufferMs = (workingHours.bufferMinutes || 0) * 60 * 1000;
          const stepMs = slotDurationMs + bufferMs;

          let slotStart = new Date(dayStartTime);

          while (
            slotStart.getTime() + slotDurationMs <=
            dayEndTime.getTime()
          ) {
            const slotEnd = new Date(slotStart.getTime() + slotDurationMs);

            // Skip past slots
            if (slotStart.getTime() > now.getTime()) {
              const startMs = slotStart.getTime();
              const endMs = slotEnd.getTime();

              // Check iCal busy overlap
              const overlapsIcal = icalBusyBlocks.some(
                (busy) =>
                  busy.start.getTime() < endMs && busy.end.getTime() > startMs,
              );

              // Check ZUVA session overlap
              const overlapsSession = coachSessions.some(
                (sess) =>
                  sess.startsAt.getTime() < endMs &&
                  sess.endsAt.getTime() > startMs,
              );

              // Check booked or cancelled slot overlap
              const overlapsBookedOrCancelled = bookedOrCancelledSlots.some(
                (b) =>
                  b.startsAt.getTime() < endMs && b.endsAt.getTime() > startMs,
              );

              if (
                !overlapsIcal &&
                !overlapsSession &&
                !overlapsBookedOrCancelled
              ) {
                candidateFreeSlots.push({
                  startsAt: slotStart,
                  endsAt: slotEnd,
                });
              }
            }

            slotStart = new Date(slotStart.getTime() + stepMs);
          }
        }
      }
    }

    curr.setDate(curr.getDate() + 1);
  }

  // 5. Reconcile DB open slots
  const existingOpenSlots = existingSlots.filter((s) => s.status === "open");

  // Identify open slots to remove (no longer match any candidate free slot)
  const slotsToDelete: string[] = [];
  for (const openSlot of existingOpenSlots) {
    const matchesCandidate = candidateFreeSlots.some(
      (cand) =>
        cand.startsAt.getTime() === openSlot.startsAt.getTime() &&
        cand.endsAt.getTime() === openSlot.endsAt.getTime(),
    );
    if (!matchesCandidate) {
      slotsToDelete.push(openSlot.id);
    }
  }

  // Identify new candidate slots to insert
  const slotsToInsert: { coachId: string; startsAt: Date; endsAt: Date }[] = [];
  for (const cand of candidateFreeSlots) {
    const alreadyExists = existingSlots.some(
      (ex) =>
        ex.startsAt.getTime() === cand.startsAt.getTime() &&
        ex.endsAt.getTime() === cand.endsAt.getTime(),
    );
    if (!alreadyExists) {
      slotsToInsert.push({
        coachId: coachUserId,
        startsAt: cand.startsAt,
        endsAt: cand.endsAt,
      });
    }
  }

  if (slotsToDelete.length > 0) {
    for (const id of slotsToDelete) {
      await db.delete(availabilitySlot).where(eq(availabilitySlot.id, id));
    }
  }

  if (slotsToInsert.length > 0) {
    await db.insert(availabilitySlot).values(slotsToInsert);
  }

  await db
    .update(coachProfile)
    .set({ lastSyncedAt: new Date() })
    .where(eq(coachProfile.userId, coachUserId));

  revalidatePath("/coaches");
  revalidatePath(`/coaches/${coachUserId}`);

  return {
    ok: true,
    data: { slotsCreated: slotsToInsert.length },
  };
}

export async function saveCoachWorkingHours(
  input: unknown,
): Promise<ActionResult<{ slotsCreated: number }>> {
  const { user: coach } = await requireRole("coach");
  const parsed = workingHoursSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  await db
    .update(coachProfile)
    .set({ workingHours: parsed.data })
    .where(eq(coachProfile.userId, coach.id));

  const syncResult = await syncCoachAvailabilityForUser(coach.id);
  revalidatePath("/coaches");
  revalidatePath(`/coaches/${coach.id}`);
  return syncResult;
}

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

  const syncResult = await syncCoachAvailabilityForUser(coach.id);
  revalidatePath("/coaches");
  revalidatePath(`/coaches/${coach.id}`);
  return syncResult;
}

export async function syncCoachAvailability(): Promise<ActionResult<{ slotsCreated: number }>> {
  const { user: coach } = await requireRole("coach");
  return syncCoachAvailabilityForUser(coach.id);
}

export async function adminSyncCoachAvailability(
  coachUserId: string,
): Promise<ActionResult<{ slotsCreated: number }>> {
  await requireRole("admin");
  return syncCoachAvailabilityForUser(coachUserId);
}

export async function adminSaveCoachIcalUrl({
  coachUserId,
  icalUrl,
}: {
  coachUserId: string;
  icalUrl: string;
}): Promise<ActionResult<{ slotsCreated: number }>> {
  await requireRole("admin");
  const trimmedUrl = icalUrl.trim();

  if (trimmedUrl !== "") {
    const parsed = icalSettingsSchema.safeParse({ icalUrl: trimmedUrl });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message };
    }
  }

  await db
    .update(coachProfile)
    .set({ icalUrl: trimmedUrl || null })
    .where(eq(coachProfile.userId, coachUserId));

  const syncResult = await syncCoachAvailabilityForUser(coachUserId);
  revalidatePath("/coaches");
  revalidatePath(`/coaches/${coachUserId}`);
  return syncResult;
}

export async function adminSaveCoachWorkingHours({
  coachUserId,
  workingHours,
}: {
  coachUserId: string;
  workingHours: unknown;
}): Promise<ActionResult<{ slotsCreated: number }>> {
  await requireRole("admin");
  const parsed = workingHoursSchema.safeParse(workingHours);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  await db
    .update(coachProfile)
    .set({ workingHours: parsed.data })
    .where(eq(coachProfile.userId, coachUserId));

  const syncResult = await syncCoachAvailabilityForUser(coachUserId);
  revalidatePath("/coaches");
  revalidatePath(`/coaches/${coachUserId}`);
  return syncResult;
}

// Keep saveCoachIcalSettings alias for backwards compatibility
export async function saveCoachIcalSettings(
  input: unknown,
): Promise<ActionResult<{ slotsCreated: number }>> {
  return saveCoachIcalUrl(input);
}


