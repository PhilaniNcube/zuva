import "server-only";

import { cache } from "react";
import { endOfDay, isValid, parseISO, startOfDay } from "date-fns";
import { and, asc, count, desc, eq, gte, isNotNull, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import { cohort, scholarProfile, user } from "@/lib/db/schema";

export const listCohorts = cache(async () => {
  return db
    .select({
      id: cohort.id,
      name: cohort.name,
      startsAt: cohort.startsAt,
      endsAt: cohort.endsAt,
      status: cohort.status,
      scholarCount: count(scholarProfile.id),
    })
    .from(cohort)
    .leftJoin(scholarProfile, eq(scholarProfile.cohortId, cohort.id))
    .groupBy(cohort.id)
    .orderBy(desc(cohort.createdAt));
});

export const listCohortsPaginated = cache(
  async ({
    page = 1,
    pageSize = 10,
    startDate,
    endDate,
  }: {
    page?: number;
    pageSize?: number;
    startDate?: string | null;
    endDate?: string | null;
  } = {}) => {
    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;

    const conditions = [];

    if (startDate) {
      const start = parseISO(startDate);
      if (isValid(start)) {
        conditions.push(gte(cohort.startsAt, startOfDay(start)));
      }
    }

    if (endDate) {
      const end = parseISO(endDate);
      if (isValid(end)) {
        conditions.push(lte(cohort.startsAt, endOfDay(end)));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(cohort)
      .where(whereClause);
    const totalCount = totalResult?.total ?? 0;
    const pageCount = Math.ceil(totalCount / validPageSize);

    const data = await db
      .select({
        id: cohort.id,
        name: cohort.name,
        startsAt: cohort.startsAt,
        endsAt: cohort.endsAt,
        status: cohort.status,
        scholarCount: count(scholarProfile.id),
      })
      .from(cohort)
      .leftJoin(scholarProfile, eq(scholarProfile.cohortId, cohort.id))
      .where(whereClause)
      .groupBy(cohort.id)
      .orderBy(desc(cohort.createdAt))
      .limit(validPageSize)
      .offset(offset);

    return {
      data,
      totalCount,
      pageCount: pageCount || 1,
      page: validPage,
      pageSize: validPageSize,
    };
  }
);

export const getCohort = cache(async (id: string) => {
  const [row] = await db.select().from(cohort).where(eq(cohort.id, id));
  return row ?? null;
});

export const listCohortScholars = cache(async (cohortId: string) => {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      country: scholarProfile.country,
      onboardedAt: scholarProfile.onboardingCompletedAt,
    })
    .from(scholarProfile)
    .innerJoin(user, eq(user.id, scholarProfile.userId))
    .where(eq(scholarProfile.cohortId, cohortId))
    .orderBy(asc(user.name));
});

/** All enrolled scholars — e.g. the onboarding-session scheduler. */
export const listScholars = cache(async () => {
  return db
    .select({
      id: user.id,
      name: user.name,
      cohortName: cohort.name,
    })
    .from(scholarProfile)
    .innerJoin(user, eq(user.id, scholarProfile.userId))
    .innerJoin(cohort, eq(cohort.id, scholarProfile.cohortId))
    .where(isNotNull(scholarProfile.cohortId))
    .orderBy(asc(user.name));
});
