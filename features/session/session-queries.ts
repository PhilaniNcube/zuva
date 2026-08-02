import "server-only";

import { cache } from "react";
import { and, asc, desc, eq, gt, gte, or } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "@/lib/db";
import {
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
