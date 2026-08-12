import "server-only";

import { cache } from "react";
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  like,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/lib/db";
import { cohort, scholarEnrollment, scholarProfile, user } from "@/lib/db/schema";
import { requireRole } from "@/lib/rbac";
import type { Role } from "@/lib/roles";

export const getScholarCohorts = cache(async (scholarId: string) => {
  return db
    .select({
      id: cohort.id,
      name: cohort.name,
      startsAt: cohort.startsAt,
      endsAt: cohort.endsAt,
      status: cohort.status,
      enrolledAt: scholarEnrollment.enrolledAt,
    })
    .from(scholarEnrollment)
    .innerJoin(cohort, eq(cohort.id, scholarEnrollment.cohortId))
    .where(eq(scholarEnrollment.scholarId, scholarId))
    .orderBy(desc(cohort.startsAt));
});

export const getScholarProfile = cache(async (userId: string) => {
  const [row] = await db
    .select()
    .from(scholarProfile)
    .where(eq(scholarProfile.userId, userId));
  return row ?? null;
});

export const getUser = cache(async (userId: string) => {
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, userId));
  return row ?? null;
});

export const getUsersForAdmin = cache(async () => {
  await requireRole("admin");
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));
  return users;
});

export const getUsersForAdminPaginated = cache(
  async ({
    page = 1,
    pageSize = 10,
    country,
    role,
    search,
    onboardingStatus,
  }: {
    page?: number;
    pageSize?: number;
    country?: string | null;
    role?: string | null;
    search?: string | null;
    onboardingStatus?: string | null;
  } = {}) => {
    await requireRole("admin");

    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;

    const conditions = [];

    if (country && country.trim() !== "" && country !== "all") {
      conditions.push(eq(scholarProfile.country, country.trim()));
    }

    if (role && role.trim() !== "" && role !== "all") {
      conditions.push(eq(user.role, role.trim() as Role));
    }

    if (onboardingStatus === "onboarded") {
      conditions.push(isNotNull(scholarProfile.onboardingCompletedAt));
    } else if (onboardingStatus === "pending") {
      conditions.push(isNull(scholarProfile.onboardingCompletedAt));
    }

    if (search && search.trim() !== "") {
      const pattern = `%${search.trim().toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`lower(${user.name})`, pattern),
          like(sql`lower(${user.email})`, pattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const availableCountriesResult = await db
      .selectDistinct({ country: scholarProfile.country })
      .from(scholarProfile)
      .where(isNotNull(scholarProfile.country))
      .orderBy(asc(scholarProfile.country));

    const availableCountries = availableCountriesResult
      .map((r) => r.country)
      .filter((c): c is string => Boolean(c && c.trim() !== ""));

    const [totalResult] = await db
      .select({ total: count() })
      .from(user)
      .leftJoin(scholarProfile, eq(scholarProfile.userId, user.id))
      .where(whereClause);

    const totalCount = totalResult?.total ?? 0;
    const pageCount = Math.ceil(totalCount / validPageSize);

    const rawUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        country: scholarProfile.country,
        degree: scholarProfile.degree,
        institution: scholarProfile.institution,
        whatsappNumber: scholarProfile.whatsappNumber,
        linkedinUrl: scholarProfile.linkedinUrl,
        bio: scholarProfile.bio,
        mtpText: scholarProfile.mtpText,
        onboardedAt: scholarProfile.onboardingCompletedAt,
        bioReviewedAt: scholarProfile.bioReviewedAt,
        bioRewriteNeeded: scholarProfile.bioRewriteNeeded,
        bioRewriteCompletedAt: scholarProfile.bioRewriteCompletedAt,
        createdAt: user.createdAt,
      })
      .from(user)
      .leftJoin(scholarProfile, eq(scholarProfile.userId, user.id))
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(validPageSize)
      .offset(offset);

    // Fetch cohort enrollments for scholar users in the result
    const scholarIds = rawUsers
      .filter((u) => u.role === "scholar")
      .map((u) => u.id);

    const enrollmentsByScholarId = new Map<string, { id: string; name: string }[]>();

    if (scholarIds.length > 0) {
      const enrollments = await db
        .select({
          scholarId: scholarEnrollment.scholarId,
          cohortId: cohort.id,
          cohortName: cohort.name,
        })
        .from(scholarEnrollment)
        .innerJoin(cohort, eq(cohort.id, scholarEnrollment.cohortId))
        .where(inArray(scholarEnrollment.scholarId, scholarIds));

      for (const e of enrollments) {
        const list = enrollmentsByScholarId.get(e.scholarId) ?? [];
        list.push({ id: e.cohortId, name: e.cohortName });
        enrollmentsByScholarId.set(e.scholarId, list);
      }
    }

    const users = rawUsers.map((u) => {
      const cohorts = enrollmentsByScholarId.get(u.id) ?? [];
      return {
        ...u,
        cohorts,
        cohortId: cohorts[0]?.id ?? null,
      };
    });

    return {
      users,
      totalCount,
      pageCount: pageCount || 1,
      page: validPage,
      pageSize: validPageSize,
      availableCountries,
    };
  }
);

/** Programme team (admin + MINDS) — hosts for onboarding 1:1 sessions. */
export const listProgrammeTeam = cache(async () => {
  return db
    .select({ id: user.id, name: user.name, role: user.role })
    .from(user)
    .where(inArray(user.role, ["admin", "minds"]))
    .orderBy(asc(user.name));
});
