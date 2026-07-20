import "server-only";

import { cache } from "react";
import { asc, count, desc, eq } from "drizzle-orm";

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
