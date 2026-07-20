import "server-only";

import { cache } from "react";
import { and, asc, desc, eq, gt, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  availabilitySlot,
  booking,
  coachProfile,
  cohort,
  programmeSession,
  user,
} from "@/lib/db/schema";

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
    .where(eq(availabilitySlot.coachId, coachId))
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

/** Masterclasses + orientations for a cohort (group sessions). */
export const listCohortSessions = cache(async (cohortId: string) => {
  return db
    .select({
      id: programmeSession.id,
      type: programmeSession.type,
      title: programmeSession.title,
      startsAt: programmeSession.startsAt,
      endsAt: programmeSession.endsAt,
      status: programmeSession.status,
      meetLink: programmeSession.meetLink,
      coachName: user.name,
    })
    .from(programmeSession)
    .leftJoin(user, eq(user.id, programmeSession.coachId))
    .where(
      and(
        eq(programmeSession.cohortId, cohortId),
        inArray(programmeSession.type, ["orientation", "masterclass"]),
      ),
    )
    .orderBy(asc(programmeSession.startsAt));
});

/** Group sessions a coach leads (masterclasses / orientations). */
export const listCoachSessions = cache(async (coachId: string) => {
  return db
    .select({
      id: programmeSession.id,
      type: programmeSession.type,
      title: programmeSession.title,
      startsAt: programmeSession.startsAt,
      status: programmeSession.status,
      meetLink: programmeSession.meetLink,
      cohortName: cohort.name,
    })
    .from(programmeSession)
    .innerJoin(cohort, eq(cohort.id, programmeSession.cohortId))
    .where(
      and(
        eq(programmeSession.coachId, coachId),
        inArray(programmeSession.type, ["orientation", "masterclass"]),
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
      type: programmeSession.type,
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

/** Admin schedule view: all group sessions across cohorts. */
export const listAdminSessions = cache(async () => {
  return db
    .select({
      id: programmeSession.id,
      type: programmeSession.type,
      title: programmeSession.title,
      startsAt: programmeSession.startsAt,
      status: programmeSession.status,
      meetLink: programmeSession.meetLink,
      cohortName: cohort.name,
      coachName: user.name,
    })
    .from(programmeSession)
    .innerJoin(cohort, eq(cohort.id, programmeSession.cohortId))
    .leftJoin(user, eq(user.id, programmeSession.coachId))
    .where(inArray(programmeSession.type, ["orientation", "masterclass"]))
    .orderBy(desc(programmeSession.startsAt));
});
