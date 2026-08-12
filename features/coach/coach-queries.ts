import "server-only";

import { cache } from "react";
import { and, asc, count, desc, eq, like, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { fetchIcalCalendarSlots, type CalendarSlot } from "@/lib/ical-parser";
import { availabilitySlot, booking, coachProfile, programmeSession, user } from "@/lib/db/schema";
import type { WorkingHoursInput } from "./working-hours";

export const listCoaches = cache(async () => {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      specialty: coachProfile.specialty,
      whatsappNumber: coachProfile.whatsappNumber,
      bio: coachProfile.bio,
    })
    .from(coachProfile)
    .innerJoin(user, eq(user.id, coachProfile.userId))
    .orderBy(asc(user.name));
});

export const listCoachesPaginated = cache(
  async ({
    page = 1,
    pageSize = 10,
    search,
    specialty,
  }: {
    page?: number;
    pageSize?: number;
    search?: string | null;
    specialty?: string | null;
  } = {}) => {
    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;

    const conditions = [];

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      conditions.push(or(like(user.name, term), like(user.email, term)));
    }

    if (specialty && specialty.trim() !== "" && specialty !== "all") {
      conditions.push(eq(coachProfile.specialty, specialty.trim() as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(coachProfile)
      .innerJoin(user, eq(user.id, coachProfile.userId))
      .where(whereClause);

    const totalCount = totalResult?.total ?? 0;
    const pageCount = Math.ceil(totalCount / validPageSize);

    const coaches = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        specialty: coachProfile.specialty,
        whatsappNumber: coachProfile.whatsappNumber,
        bio: coachProfile.bio,
        createdAt: user.createdAt,
      })
      .from(coachProfile)
      .innerJoin(user, eq(user.id, coachProfile.userId))
      .where(whereClause)
      .orderBy(asc(user.name))
      .limit(validPageSize)
      .offset(offset);

    return {
      coaches,
      totalCount,
      pageCount: pageCount || 1,
      page: validPage,
      pageSize: validPageSize,
    };
  }
);

export const getCoachProfile = cache(async (userId: string) => {
  const [profile] = await db
    .select({
      id: coachProfile.id,
      userId: coachProfile.userId,
      specialty: coachProfile.specialty,
      whatsappNumber: coachProfile.whatsappNumber,
      bio: coachProfile.bio,
      icalUrl: coachProfile.icalUrl,
      workingHours: coachProfile.workingHours,
      lastSyncedAt: coachProfile.lastSyncedAt,
    })
    .from(coachProfile)
    .where(eq(coachProfile.userId, userId));
  return profile ?? null;
});

export const getCoachDetail = cache(async (coachUserId: string) => {
  const [data] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      profileId: coachProfile.id,
      specialty: coachProfile.specialty,
      whatsappNumber: coachProfile.whatsappNumber,
      bio: coachProfile.bio,
      icalUrl: coachProfile.icalUrl,
      workingHours: coachProfile.workingHours,
      lastSyncedAt: coachProfile.lastSyncedAt,
    })
    .from(coachProfile)
    .innerJoin(user, eq(user.id, coachProfile.userId))
    .where(eq(user.id, coachUserId));

  if (!data) return null;

  const sessions = await db
    .select({
      id: programmeSession.id,
      title: programmeSession.title,
      startsAt: programmeSession.startsAt,
      endsAt: programmeSession.endsAt,
      meetLink: programmeSession.meetLink,
      status: programmeSession.status,
    })
    .from(programmeSession)
    .where(eq(programmeSession.coachId, coachUserId))
    .orderBy(desc(programmeSession.startsAt))
    .limit(50);

  const slots = await db
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
    .where(eq(availabilitySlot.coachId, coachUserId))
    .orderBy(asc(availabilitySlot.startsAt));

  let icalBusyBlocks: CalendarSlot[] = [];
  if (data.icalUrl) {
    try {
      icalBusyBlocks = await fetchIcalCalendarSlots(data.icalUrl);
    } catch {
      icalBusyBlocks = [];
    }
  }

  return {
    ...data,
    workingHours: data.workingHours as WorkingHoursInput | null,
    sessions,
    slots,
    icalBusyBlocks,
  };
});


