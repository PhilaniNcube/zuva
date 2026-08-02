import "server-only";

import { cache } from "react";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "@/lib/db";
import {
  attendance,
  availabilitySlot,
  booking,
  coachProfile,
  cohort,
  programmeSession,
  sessionType,
  user,
} from "@/lib/db/schema";

/** Active session types, e.g. for dropdowns and the booking topic picker. */
export const listSessionTypes = cache(
  async (filter?: { kind?: "masterclass" | "coaching" | "orientation" | "onboarding"; format?: "group" | "one_on_one" }) => {
    const conditions = [eq(sessionType.isActive, true)];
    if (filter?.kind) conditions.push(eq(sessionType.kind, filter.kind));
    if (filter?.format) conditions.push(eq(sessionType.format, filter.format));
    return db
      .select({
        id: sessionType.id,
        name: sessionType.name,
        kind: sessionType.kind,
        format: sessionType.format,
      })
      .from(sessionType)
      .where(and(...conditions))
      .orderBy(asc(sessionType.sortOrder), asc(sessionType.name));
  },
);

/** Open, future slots across all coaches — the scholar booking browser. */
export const listOpenSlots = cache(async () => {
  return db
    .select({
      slotId: availabilitySlot.id,
      startsAt: availabilitySlot.startsAt,
      endsAt: availabilitySlot.endsAt,
      coachId: user.id,
      coachName: user.name,
      specialty: coachProfile.specialty,
    })
    .from(availabilitySlot)
    .innerJoin(user, eq(user.id, availabilitySlot.coachId))
    .leftJoin(coachProfile, eq(coachProfile.userId, user.id))
    .where(
      and(
        eq(availabilitySlot.status, "open"),
        gt(availabilitySlot.startsAt, new Date()),
      ),
    )
    .orderBy(asc(availabilitySlot.startsAt));
});

/** A coach's own slots, with confirmed booking + scholar info attached. */
export const listCoachSlots = cache(async (coachId: string) => {
  return db
    .select({
      slotId: availabilitySlot.id,
      startsAt: availabilitySlot.startsAt,
      endsAt: availabilitySlot.endsAt,
      status: availabilitySlot.status,
      bookingId: booking.id,
      scholarName: user.name,
      sessionId: programmeSession.id,
      meetLink: programmeSession.meetLink,
    })
    .from(availabilitySlot)
    .leftJoin(
      booking,
      and(
        eq(booking.slotId, availabilitySlot.id),
        eq(booking.status, "confirmed"),
      ),
    )
    .leftJoin(user, eq(user.id, booking.scholarId))
    .leftJoin(programmeSession, eq(programmeSession.id, booking.sessionId))
    .where(
      and(
        eq(availabilitySlot.coachId, coachId),
        gte(availabilitySlot.endsAt, new Date()),
      ),
    )
    .orderBy(asc(availabilitySlot.startsAt));
});

/** A scholar's bookings with session + coach details. */
export const listScholarBookings = cache(async (scholarId: string) => {
  return db
    .select({
      bookingId: booking.id,
      bookingStatus: booking.status,
      sessionId: programmeSession.id,
      title: programmeSession.title,
      startsAt: programmeSession.startsAt,
      endsAt: programmeSession.endsAt,
      meetLink: programmeSession.meetLink,
      coachName: user.name,
    })
    .from(booking)
    .innerJoin(programmeSession, eq(programmeSession.id, booking.sessionId))
    .leftJoin(user, eq(user.id, programmeSession.coachId))
    .where(eq(booking.scholarId, scholarId))
    .orderBy(desc(programmeSession.startsAt));
});

/**
 * Sessions a scholar sees for their cohort: all group sessions (masterclasses,
 * orientations) plus one_on_one sessions targeted at them (onboarding).
 */
export const listCohortSessions = cache(
  async (cohortId: string, scholarId?: string) => {
    const visibility = scholarId
      ? or(
          eq(sessionType.format, "group"),
          eq(programmeSession.scholarId, scholarId),
        )
      : eq(sessionType.format, "group");

    return db
      .select({
        id: programmeSession.id,
        kind: sessionType.kind,
        format: sessionType.format,
        typeName: sessionType.name,
        title: programmeSession.title,
        startsAt: programmeSession.startsAt,
        endsAt: programmeSession.endsAt,
        status: programmeSession.status,
        meetLink: programmeSession.meetLink,
        coachName: user.name,
      })
      .from(programmeSession)
      .innerJoin(
        sessionType,
        eq(sessionType.id, programmeSession.sessionTypeId),
      )
      .leftJoin(user, eq(user.id, programmeSession.coachId))
      .where(and(eq(programmeSession.cohortId, cohortId), visibility))
      .orderBy(asc(programmeSession.startsAt));
  },
);

/** Group sessions a coach leads (masterclasses / orientations). */
export const listCoachSessions = cache(async (coachId: string) => {
  return db
    .select({
      id: programmeSession.id,
      kind: sessionType.kind,
      typeName: sessionType.name,
      title: programmeSession.title,
      startsAt: programmeSession.startsAt,
      status: programmeSession.status,
      meetLink: programmeSession.meetLink,
      cohortName: cohort.name,
    })
    .from(programmeSession)
    .innerJoin(sessionType, eq(sessionType.id, programmeSession.sessionTypeId))
    .innerJoin(cohort, eq(cohort.id, programmeSession.cohortId))
    .where(
      and(
        eq(programmeSession.coachId, coachId),
        eq(sessionType.format, "group"),
      ),
    )
    .orderBy(asc(programmeSession.startsAt));
});

export const getSessionDetail = cache(async (sessionId: string) => {
  const [row] = await db
    .select({
      id: programmeSession.id,
      cohortId: programmeSession.cohortId,
      coachId: programmeSession.coachId,
      scholarId: programmeSession.scholarId,
      sessionTypeId: programmeSession.sessionTypeId,
      kind: sessionType.kind,
      format: sessionType.format,
      typeName: sessionType.name,
      title: programmeSession.title,
      description: programmeSession.description,
      startsAt: programmeSession.startsAt,
      endsAt: programmeSession.endsAt,
      meetLink: programmeSession.meetLink,
      status: programmeSession.status,
      coachName: user.name,
      specialty: coachProfile.specialty,
      coachWhatsapp: coachProfile.whatsappNumber,
    })
    .from(programmeSession)
    .innerJoin(sessionType, eq(sessionType.id, programmeSession.sessionTypeId))
    .leftJoin(user, eq(user.id, programmeSession.coachId))
    .leftJoin(coachProfile, eq(coachProfile.userId, programmeSession.coachId))
    .where(eq(programmeSession.id, sessionId));
  return row ?? null;
});

export const getConfirmedBooking = cache(
  async (sessionId: string, scholarId: string) => {
    const [row] = await db
      .select()
      .from(booking)
      .where(
        and(
          eq(booking.sessionId, sessionId),
          eq(booking.scholarId, scholarId),
          eq(booking.status, "confirmed"),
        ),
      );
    return row ?? null;
  },
);

/** Admin schedule view: group sessions + targeted onboarding 1:1s. */
export const listAdminSessions = cache(async () => {
  const scholar = alias(user, "scholar");
  return db
    .select({
      id: programmeSession.id,
      kind: sessionType.kind,
      typeName: sessionType.name,
      title: programmeSession.title,
      startsAt: programmeSession.startsAt,
      status: programmeSession.status,
      meetLink: programmeSession.meetLink,
      cohortName: cohort.name,
      coachName: user.name,
      scholarName: scholar.name,
    })
    .from(programmeSession)
    .innerJoin(sessionType, eq(sessionType.id, programmeSession.sessionTypeId))
    .innerJoin(cohort, eq(cohort.id, programmeSession.cohortId))
    .leftJoin(user, eq(user.id, programmeSession.coachId))
    .leftJoin(scholar, eq(scholar.id, programmeSession.scholarId))
    .where(
      or(
        eq(sessionType.format, "group"),
        eq(sessionType.kind, "onboarding"),
      ),
    )
    .orderBy(desc(programmeSession.startsAt));
});

// ---------------------------------------------------------------------------
// Admin scholar overview
// ---------------------------------------------------------------------------

/**
 * Sessions a scholar still has coming up: their cohort's group sessions,
 * onboarding 1:1s targeted at them, and coaching 1:1s they've booked.
 */
export const listScholarUpcomingSessions = cache(
  async (scholarId: string, cohortId: string | null) => {
    const visibility = [
      cohortId
        ? and(
            eq(programmeSession.cohortId, cohortId),
            eq(sessionType.format, "group"),
          )
        : undefined,
      and(
        eq(programmeSession.scholarId, scholarId),
        eq(sessionType.kind, "onboarding"),
      ),
      and(
        eq(booking.scholarId, scholarId),
        eq(booking.status, "confirmed"),
        eq(sessionType.kind, "coaching"),
      ),
    ];

    return db
      .select({
        id: programmeSession.id,
        kind: sessionType.kind,
        format: sessionType.format,
        typeName: sessionType.name,
        title: programmeSession.title,
        startsAt: programmeSession.startsAt,
        endsAt: programmeSession.endsAt,
        coachName: user.name,
      })
      .from(programmeSession)
      .innerJoin(sessionType, eq(sessionType.id, programmeSession.sessionTypeId))
      .leftJoin(user, eq(user.id, programmeSession.coachId))
      .leftJoin(
        booking,
        and(
          eq(booking.sessionId, programmeSession.id),
          eq(booking.scholarId, scholarId),
          eq(booking.status, "confirmed"),
        ),
      )
      .where(
        and(
          eq(programmeSession.status, "scheduled"),
          gte(programmeSession.startsAt, new Date()),
          or(...visibility),
        ),
      )
      .orderBy(asc(programmeSession.startsAt));
  },
);

/** Sessions the scholar has attended (has an attendance record). */
export const listScholarAttendedSessions = cache(
  async (scholarId: string) => {
    return db
      .select({
        sessionId: attendance.sessionId,
        title: programmeSession.title,
        kind: sessionType.kind,
        typeName: sessionType.name,
        startsAt: programmeSession.startsAt,
        endsAt: programmeSession.endsAt,
        joinedAt: attendance.joinedAt,
        coachName: user.name,
      })
      .from(attendance)
      .innerJoin(programmeSession, eq(programmeSession.id, attendance.sessionId))
      .innerJoin(sessionType, eq(sessionType.id, programmeSession.sessionTypeId))
      .leftJoin(user, eq(user.id, programmeSession.coachId))
      .where(eq(attendance.scholarId, scholarId))
      .orderBy(desc(attendance.joinedAt));
  },
);

/**
 * Attendance aggregates: how many sessions were attended vs how many the
 * scholar was expected to attend (past, non-cancelled group/targeted/booked
 * sessions). Cancelled sessions are excluded from the denominator.
 */
export const getScholarAttendanceStats = cache(
  async (scholarId: string, cohortId: string | null) => {
    const now = new Date();

    const [attendedRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(eq(attendance.scholarId, scholarId));
    const attendedCount = attendedRow?.count ?? 0;

    const visibility = [
      cohortId
        ? and(
            eq(programmeSession.cohortId, cohortId),
            eq(sessionType.format, "group"),
          )
        : undefined,
      and(
        eq(programmeSession.scholarId, scholarId),
        eq(sessionType.kind, "onboarding"),
      ),
      and(
        eq(booking.scholarId, scholarId),
        eq(booking.status, "confirmed"),
        eq(sessionType.kind, "coaching"),
      ),
    ];

    const [eligibleRow] = await db
      .select({
        count: sql<number>`count(distinct ${programmeSession.id})`,
      })
      .from(programmeSession)
      .innerJoin(sessionType, eq(sessionType.id, programmeSession.sessionTypeId))
      .leftJoin(
        booking,
        and(
          eq(booking.sessionId, programmeSession.id),
          eq(booking.scholarId, scholarId),
          eq(booking.status, "confirmed"),
        ),
      )
      .where(
        and(
          lte(programmeSession.endsAt, now),
          ne(programmeSession.status, "cancelled"),
          or(...visibility),
        ),
      );
    const eligibleCompletedCount = eligibleRow?.count ?? 0;

    return {
      attendedCount,
      eligibleCompletedCount,
      attendanceRate:
        eligibleCompletedCount > 0
          ? Math.round((attendedCount / eligibleCompletedCount) * 100)
          : null,
    };
  },
);
