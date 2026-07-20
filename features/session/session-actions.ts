"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import {
  attendance,
  availabilitySlot,
  booking,
  programmeSession,
  user,
} from "@/lib/db/schema";
import { cancelMeetEvent, createMeetEvent } from "@/lib/google-calendar";
import { requireRole, requireUser } from "@/lib/rbac";
import { getScholarProfile } from "@/features/user/user-queries";
import { getConfirmedBooking, getSessionDetail } from "./session-queries";

// ---------------------------------------------------------------------------
// Coach: availability slots
// ---------------------------------------------------------------------------

const slotSchema = z
  .object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((v) => v.endsAt > v.startsAt, {
    message: "End time must be after the start time",
  })
  .refine((v) => v.startsAt > new Date(), {
    message: "Slots must be in the future",
  });

export async function publishSlot(input: unknown): Promise<ActionResult> {
  const { user: coach } = await requireRole("coach");
  const parsed = slotSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  await db.insert(availabilitySlot).values({
    coachId: coach.id,
    startsAt: parsed.data.startsAt,
    endsAt: parsed.data.endsAt,
  });
  refresh();
  return { ok: true, data: undefined };
}

export async function cancelSlot(slotId: string): Promise<ActionResult> {
  const { user: coach } = await requireRole("coach");
  const [slot] = await db
    .select()
    .from(availabilitySlot)
    .where(eq(availabilitySlot.id, slotId));
  if (!slot || slot.coachId !== coach.id) {
    return { ok: false, error: "Slot not found" };
  }
  if (slot.status !== "open") {
    return {
      ok: false,
      error: "Only open slots can be cancelled — this one is already booked.",
    };
  }
  await db
    .update(availabilitySlot)
    .set({ status: "cancelled" })
    .where(eq(availabilitySlot.id, slotId));
  refresh();
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Scholar: booking
// ---------------------------------------------------------------------------

export async function bookSlot(slotId: string): Promise<ActionResult> {
  const { user: scholar } = await requireRole("scholar");
  const profile = await getScholarProfile(scholar.id);
  if (!profile?.cohortId) {
    return {
      ok: false,
      error: "You are not enrolled in a cohort yet — please contact the programme team.",
    };
  }

  const [slot] = await db
    .select({
      id: availabilitySlot.id,
      coachId: availabilitySlot.coachId,
      startsAt: availabilitySlot.startsAt,
      endsAt: availabilitySlot.endsAt,
      status: availabilitySlot.status,
      coachName: user.name,
    })
    .from(availabilitySlot)
    .innerJoin(user, eq(user.id, availabilitySlot.coachId))
    .where(eq(availabilitySlot.id, slotId));

  if (!slot || slot.status !== "open" || slot.startsAt <= new Date()) {
    return { ok: false, error: "This slot is no longer available." };
  }

  // Best-effort Meet link (no-op without Google credentials, e.g. local dev).
  const meet = await createMeetEvent({
    title: `ZUVA 1:1 — ${scholar.name} × ${slot.coachName}`,
    description: `ZUVA coaching session between ${scholar.name} and ${slot.coachName}.`,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
  });

  try {
    await db.transaction(async (tx) => {
      const [session] = await tx
        .insert(programmeSession)
        .values({
          cohortId: profile.cohortId!,
          coachId: slot.coachId,
          type: "coaching_1on1",
          title: `1:1 coaching — ${slot.coachName}`,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          googleEventId: meet?.eventId ?? null,
          meetLink: meet?.meetLink ?? null,
        })
        .returning();
      await tx.insert(booking).values({
        slotId: slot.id,
        scholarId: scholar.id,
        sessionId: session.id,
      });
      await tx
        .update(availabilitySlot)
        .set({ status: "booked" })
        .where(eq(availabilitySlot.id, slot.id));
    });
  } catch {
    // Unique index on booking.slotId protects against a race between two
    // scholars booking the same slot.
    if (meet) await cancelMeetEvent(meet.eventId);
    return { ok: false, error: "This slot was just taken — please pick another." };
  }

  refresh();
  return { ok: true, data: undefined };
}

export async function cancelBooking(bookingId: string): Promise<ActionResult> {
  const { user: scholar } = await requireRole("scholar");
  const [row] = await db
    .select({
      booking: booking,
      session: programmeSession,
    })
    .from(booking)
    .innerJoin(programmeSession, eq(programmeSession.id, booking.sessionId))
    .where(eq(booking.id, bookingId));

  if (!row || row.booking.scholarId !== scholar.id) {
    return { ok: false, error: "Booking not found" };
  }
  if (row.booking.status !== "confirmed") {
    return { ok: false, error: "This booking is already cancelled." };
  }
  if (row.session.startsAt <= new Date()) {
    return { ok: false, error: "Past sessions can't be cancelled." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(booking)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(eq(booking.id, bookingId));
    await tx
      .update(availabilitySlot)
      .set({ status: "open" })
      .where(eq(availabilitySlot.id, row.booking.slotId));
    await tx
      .update(programmeSession)
      .set({ status: "cancelled" })
      .where(eq(programmeSession.id, row.session.id));
  });
  if (row.session.googleEventId) {
    await cancelMeetEvent(row.session.googleEventId);
  }

  refresh();
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Admin: cohort (group) sessions
// ---------------------------------------------------------------------------

const cohortSessionSchema = z
  .object({
    cohortId: z.string().min(1, "Pick a cohort"),
    type: z.enum(["orientation", "masterclass"]),
    title: z.string().trim().min(3, "Title is required").max(150),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    coachId: z.string().optional().or(z.literal("")),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((v) => v.endsAt > v.startsAt, {
    message: "End time must be after the start time",
  });

export async function createCohortSession(
  input: unknown,
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = cohortSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  const meet = await createMeetEvent({
    title: `ZUVA — ${v.title}`,
    description: v.description || null,
    startsAt: v.startsAt,
    endsAt: v.endsAt,
  });

  await db.insert(programmeSession).values({
    cohortId: v.cohortId,
    coachId: v.coachId || null,
    type: v.type,
    title: v.title,
    description: v.description || null,
    startsAt: v.startsAt,
    endsAt: v.endsAt,
    googleEventId: meet?.eventId ?? null,
    meetLink: meet?.meetLink ?? null,
  });

  refresh();
  return { ok: true, data: undefined };
}

export async function cancelCohortSession(
  sessionId: string,
): Promise<ActionResult> {
  await requireRole("admin");
  const [session] = await db
    .select()
    .from(programmeSession)
    .where(eq(programmeSession.id, sessionId));
  if (!session) return { ok: false, error: "Session not found" };

  await db
    .update(programmeSession)
    .set({ status: "cancelled" })
    .where(eq(programmeSession.id, sessionId));
  if (session.googleEventId) {
    await cancelMeetEvent(session.googleEventId);
  }

  refresh();
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Join call — logs scholar attendance, then redirects to the Meet link
// ---------------------------------------------------------------------------

export async function joinCall(sessionId: string): Promise<ActionResult> {
  const { user: currentUser } = await requireUser();
  const session = await getSessionDetail(sessionId);

  if (!session) return { ok: false, error: "Session not found" };
  if (session.status === "cancelled") {
    return { ok: false, error: "This session was cancelled." };
  }
  if (!session.meetLink) {
    return {
      ok: false,
      error: "The Meet link isn't available yet — check back shortly before the session starts.",
    };
  }

  const role = currentUser.role;

  if (role === "scholar") {
    let allowed = false;
    if (session.type === "coaching_1on1") {
      allowed = !!(await getConfirmedBooking(sessionId, currentUser.id));
    } else {
      const profile = await getScholarProfile(currentUser.id);
      allowed = profile?.cohortId === session.cohortId;
    }
    if (!allowed) {
      return { ok: false, error: "You don't have access to this session." };
    }
    // Automated attendance: logged the moment the scholar clicks Join Call.
    await db
      .insert(attendance)
      .values({ sessionId, scholarId: currentUser.id })
      .onConflictDoNothing();
    redirect(session.meetLink);
  }

  if ((role === "coach" && session.coachId === currentUser.id) || role === "admin") {
    redirect(session.meetLink);
  }

  return { ok: false, error: "You don't have access to this session." };
}
