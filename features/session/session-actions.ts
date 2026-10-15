"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import {
  attendance,
  availabilitySlot,
  booking,
  programmeSession,
  scholarEnrollment,
  sessionType,
  user,
} from "@/lib/db/schema";
import { sendSessionInviteEmail } from "@/lib/email";
import { cancelMeetEvent, createMeetEvent } from "@/lib/google-calendar";
import { buildSessionIcs } from "@/lib/ics";
import { requireRole, requireUser } from "@/lib/rbac";
import type { Role } from "@/lib/roles";
import { getScholarProfile } from "@/features/user/user-queries";
import { canViewSession } from "./session-access";
import { getSessionDetail } from "./session-queries";

/** Run an async mapper with bounded concurrency (keeps email sends rate-safe). */
async function mapLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < items.length; i += limit) {
    await Promise.allSettled(items.slice(i, i + limit).map(fn));
  }
}

/**
 * Email cohort scholars a calendar invite (`.ics` + join link) for a group
 * session. Scholars are intentionally not added as Google Calendar attendees.
 */
async function sendCohortInvites(session: {
  id: string;
  cohortId: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  meetLink: string | null;
}): Promise<void> {
  const scholars = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .innerJoin(scholarEnrollment, eq(scholarEnrollment.scholarId, user.id))
    .where(eq(scholarEnrollment.cohortId, session.cohortId));

  if (scholars.length === 0) return;

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const sessionUrl = `${baseUrl}/sessions/${session.id}`;
  const description = [
    session.description,
    session.meetLink ? `Join video call: ${session.meetLink}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join("\n\n");

  const icsContent = buildSessionIcs({
    uid: session.id,
    title: session.title,
    description,
    location: session.meetLink,
    url: sessionUrl,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
  });

  await mapLimit(scholars, 3, (scholar) =>
    sendSessionInviteEmail({
      to: scholar.email,
      recipientName: scholar.name,
      sessionTitle: session.title,
      startsAt: session.startsAt,
      meetLink: session.meetLink,
      sessionUrl,
      icsContent,
      userId: scholar.id,
    }),
  );
}

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
  revalidatePath("/", "layout");
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
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Scholar: booking
// ---------------------------------------------------------------------------

export async function bookSlot(
  slotId: string,
  sessionTypeId: string,
): Promise<ActionResult> {
  const { user: scholar } = await requireRole("scholar");
  const profile = await getScholarProfile(scholar.id);
  if (!profile?.cohortId) {
    return {
      ok: false,
      error: "You are not enrolled in a cohort yet — please contact the programme team.",
    };
  }

  // The scholar picks the coaching topic at booking time.
  const [topic] = await db
    .select()
    .from(sessionType)
    .where(eq(sessionType.id, sessionTypeId));
  if (
    !topic ||
    !topic.isActive ||
    topic.kind !== "coaching" ||
    topic.format !== "one_on_one"
  ) {
    return { ok: false, error: "Please pick a valid coaching session type." };
  }

  const [slot] = await db
    .select({
      id: availabilitySlot.id,
      coachId: availabilitySlot.coachId,
      startsAt: availabilitySlot.startsAt,
      endsAt: availabilitySlot.endsAt,
      status: availabilitySlot.status,
      coachName: user.name,
      coachEmail: user.email,
    })
    .from(availabilitySlot)
    .innerJoin(user, eq(user.id, availabilitySlot.coachId))
    .where(eq(availabilitySlot.id, slotId));

  if (!slot || slot.status !== "open" || slot.startsAt <= new Date()) {
    return { ok: false, error: "This slot is no longer available." };
  }

  // Best-effort Meet link (no-op without Google credentials, e.g. local dev).
  const meet = await createMeetEvent({
    title: `ZUVA ${topic.name} — ${scholar.name} × ${slot.coachName}`,
    description: `ZUVA coaching session (${topic.name}) between ${scholar.name} and ${slot.coachName}.`,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    attendees: [scholar.email, slot.coachEmail],
  });

  try {
    await db.transaction(async (tx) => {
      const [session] = await tx
        .insert(programmeSession)
        .values({
          cohortId: profile.cohortId!,
          sessionTypeId: topic.id,
          coachId: slot.coachId,
          title: `${topic.name} — ${slot.coachName}`,
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

  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Admin: cohort (group) sessions
// ---------------------------------------------------------------------------

const cohortSessionSchema = z
  .object({
    cohortId: z.string().min(1, "Pick a cohort"),
    sessionTypeId: z.string().min(1, "Pick a session type"),
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

  const [type] = await db
    .select()
    .from(sessionType)
    .where(eq(sessionType.id, v.sessionTypeId));
  if (!type || !type.isActive || type.format !== "group") {
    return { ok: false, error: "Please pick a valid group session type." };
  }

  const attendees: string[] = [];
  if (v.coachId) {
    const [assignedCoach] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, v.coachId));
    if (assignedCoach?.email) attendees.push(assignedCoach.email);
  }

  const meet = await createMeetEvent({
    title: `ZUVA — ${v.title}`,
    description: v.description || null,
    startsAt: v.startsAt,
    endsAt: v.endsAt,
    attendees: attendees.length > 0 ? attendees : undefined,
  });

  const [created] = await db
    .insert(programmeSession)
    .values({
      cohortId: v.cohortId,
      sessionTypeId: type.id,
      coachId: v.coachId || null,
      title: v.title,
      description: v.description || null,
      startsAt: v.startsAt,
      endsAt: v.endsAt,
      googleEventId: meet?.eventId ?? null,
      meetLink: meet?.meetLink ?? null,
    })
    .returning();

  // Distribute calendar invites to enrolled scholars (best-effort).
  await sendCohortInvites(created);

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Admin: onboarding 1:1 sessions (scholar × programme team)
// ---------------------------------------------------------------------------

const onboardingSessionSchema = z
  .object({
    scholarId: z.string().min(1, "Pick a scholar"),
    hostId: z.string().min(1, "Pick a host"),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((v) => v.endsAt > v.startsAt, {
    message: "End time must be after the start time",
  });

export async function createOnboardingSession(
  input: unknown,
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = onboardingSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  // There is exactly one active onboarding type — seeded.
  const [type] = await db
    .select()
    .from(sessionType)
    .where(
      and(eq(sessionType.kind, "onboarding"), eq(sessionType.isActive, true)),
    )
    .orderBy(asc(sessionType.sortOrder))
    .limit(1);
  if (!type) {
    return { ok: false, error: "No active onboarding session type exists." };
  }

  const [scholar] = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(and(eq(user.id, v.scholarId), eq(user.role, "scholar")));
  if (!scholar) return { ok: false, error: "Scholar not found" };

  const profile = await getScholarProfile(scholar.id);
  if (!profile?.cohortId) {
    return { ok: false, error: "This scholar is not enrolled in a cohort." };
  }

  const [host] = await db
    .select({ id: user.id, email: user.email, role: user.role })
    .from(user)
    .where(eq(user.id, v.hostId));
  if (!host || (host.role !== "admin" && host.role !== "minds")) {
    return { ok: false, error: "The host must be a programme team member." };
  }

  const meet = await createMeetEvent({
    title: `ZUVA ${type.name} — ${scholar.name}`,
    description: `ZUVA onboarding session for ${scholar.name} with the programme team.`,
    startsAt: v.startsAt,
    endsAt: v.endsAt,
    attendees: [scholar.email, host.email],
  });

  await db.insert(programmeSession).values({
    cohortId: profile.cohortId,
    sessionTypeId: type.id,
    coachId: host.id,
    scholarId: scholar.id,
    title: `${type.name} — ${scholar.name}`,
    startsAt: v.startsAt,
    endsAt: v.endsAt,
    googleEventId: meet?.eventId ?? null,
    meetLink: meet?.meetLink ?? null,
  });

  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Attendance register — manual admin/coach override
// ---------------------------------------------------------------------------

const attendanceMarkSchema = z.object({
  sessionId: z.string().min(1, "Session is required"),
  scholarId: z.string().min(1, "Scholar is required"),
  present: z.boolean(),
});

export async function markAttendance(input: unknown): Promise<ActionResult> {
  const { user: currentUser } = await requireUser();
  if (currentUser.role !== "admin" && currentUser.role !== "coach") {
    return { ok: false, error: "Only admins and coaches can edit attendance." };
  }

  const parsed = attendanceMarkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { sessionId, scholarId, present } = parsed.data;

  const session = await getSessionDetail(sessionId);
  if (!session) return { ok: false, error: "Session not found" };
  if (currentUser.role === "coach" && session.coachId !== currentUser.id) {
    return {
      ok: false,
      error: "You can only manage attendance for your own sessions.",
    };
  }

  if (present) {
    await db
      .insert(attendance)
      .values({ sessionId, scholarId, source: "manual_admin" })
      .onConflictDoNothing();
  } else {
    await db
      .delete(attendance)
      .where(
        and(
          eq(attendance.sessionId, sessionId),
          eq(attendance.scholarId, scholarId),
        ),
      );
  }

  revalidatePath("/", "layout");
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

  const allowed = await canViewSession(
    { id: currentUser.id, role: currentUser.role as Role },
    session,
  );
  if (!allowed) {
    return { ok: false, error: "You don't have access to this session." };
  }

  if (currentUser.role === "scholar") {
    // Automated attendance: logged when the scholar clicks Join Call, but only
    // around the live window so premature/preview clicks aren't recorded.
    const now = Date.now();
    const earlyMs = 15 * 60 * 1000;
    const lateMs = 30 * 60 * 1000;
    const withinWindow =
      now >= session.startsAt.getTime() - earlyMs &&
      now <= session.endsAt.getTime() + lateMs;
    if (withinWindow) {
      await db
        .insert(attendance)
        .values({ sessionId, scholarId: currentUser.id })
        .onConflictDoNothing();
    }
  }

  redirect(session.meetLink);
}
