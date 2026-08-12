import "server-only";

import { cache } from "react";
import { endOfDay, isValid, parseISO, startOfDay } from "date-fns";
import { and, asc, count, desc, eq, gte, isNotNull, isNull, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import { cohort, scholarEnrollment, scholarProfile, user } from "@/lib/db/schema";

export const listCohorts = cache(async () => {
  return db
    .select({
      id: cohort.id,
      name: cohort.name,
      startsAt: cohort.startsAt,
      endsAt: cohort.endsAt,
      status: cohort.status,
      scholarCount: count(scholarEnrollment.id),
    })
    .from(cohort)
    .leftJoin(scholarEnrollment, eq(scholarEnrollment.cohortId, cohort.id))
    .groupBy(cohort.id)
    .orderBy(desc(cohort.startsAt));
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
        scholarCount: count(scholarEnrollment.id),
      })
      .from(cohort)
      .leftJoin(scholarEnrollment, eq(scholarEnrollment.cohortId, cohort.id))
      .where(whereClause)
      .groupBy(cohort.id)
      .orderBy(desc(cohort.startsAt))
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
      degree: scholarProfile.degree,
      institution: scholarProfile.institution,
      whatsappNumber: scholarProfile.whatsappNumber,
      linkedinUrl: scholarProfile.linkedinUrl,
      onboardedAt: scholarProfile.onboardingCompletedAt,
    })
    .from(scholarEnrollment)
    .innerJoin(user, eq(user.id, scholarEnrollment.scholarId))
    .leftJoin(scholarProfile, eq(scholarProfile.userId, user.id))
    .where(eq(scholarEnrollment.cohortId, cohortId))
    .orderBy(asc(user.name));
});

export const listCohortScholarsPaginated = cache(
  async ({
    cohortId,
    page = 1,
    pageSize = 10,
    country,
    onboardingStatus,
  }: {
    cohortId: string;
    page?: number;
    pageSize?: number;
    country?: string | null;
    onboardingStatus?: string | null;
  }) => {
    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;

    const conditions = [eq(scholarEnrollment.cohortId, cohortId)];

    if (country && country.trim() !== "" && country !== "all") {
      conditions.push(eq(scholarProfile.country, country.trim()));
    }

    if (onboardingStatus === "onboarded") {
      conditions.push(isNotNull(scholarProfile.onboardingCompletedAt));
    } else if (onboardingStatus === "pending") {
      conditions.push(isNull(scholarProfile.onboardingCompletedAt));
    }

    const whereClause = and(...conditions);

    const availableCountriesResult = await db
      .selectDistinct({ country: scholarProfile.country })
      .from(scholarEnrollment)
      .innerJoin(scholarProfile, eq(scholarProfile.userId, scholarEnrollment.scholarId))
      .where(
        and(
          eq(scholarEnrollment.cohortId, cohortId),
          isNotNull(scholarProfile.country)
        )
      )
      .orderBy(asc(scholarProfile.country));

    const availableCountries = availableCountriesResult
      .map((r) => r.country)
      .filter((c): c is string => Boolean(c && c.trim() !== ""));

    const [totalResult] = await db
      .select({ total: count() })
      .from(scholarEnrollment)
      .leftJoin(scholarProfile, eq(scholarProfile.userId, scholarEnrollment.scholarId))
      .where(whereClause);

    const totalCount = totalResult?.total ?? 0;
    const pageCount = Math.ceil(totalCount / validPageSize);

    const scholars = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        country: scholarProfile.country,
        degree: scholarProfile.degree,
        institution: scholarProfile.institution,
        whatsappNumber: scholarProfile.whatsappNumber,
        linkedinUrl: scholarProfile.linkedinUrl,
        onboardedAt: scholarProfile.onboardingCompletedAt,
      })
      .from(scholarEnrollment)
      .innerJoin(user, eq(user.id, scholarEnrollment.scholarId))
      .leftJoin(scholarProfile, eq(scholarProfile.userId, user.id))
      .where(whereClause)
      .orderBy(asc(user.name))
      .limit(validPageSize)
      .offset(offset);

    return {
      scholars,
      totalCount,
      pageCount: pageCount || 1,
      page: validPage,
      pageSize: validPageSize,
      availableCountries,
    };
  }
);

/** All enrolled scholars — e.g. the onboarding-session scheduler. */
export const listScholars = cache(async () => {
  return db
    .select({
      id: user.id,
      name: user.name,
      cohortName: cohort.name,
    })
    .from(scholarEnrollment)
    .innerJoin(user, eq(user.id, scholarEnrollment.scholarId))
    .innerJoin(cohort, eq(cohort.id, scholarEnrollment.cohortId))
    .orderBy(asc(user.name));
});
