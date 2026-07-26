import "server-only";

import { revalidateTag, updateTag, unstable_cache } from "next/cache";
import { eq, inArray, isNotNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  certificate,
  cohort,
  programmeSession,
  scholarProfile,
  submission,
  user,
} from "@/lib/db/schema";

export const DASHBOARD_CACHE_TAGS = {
  scholars: "dashboard:scholars",
  sessions: "dashboard:sessions",
  submissions: "dashboard:submissions",
  certificates: "dashboard:certificates",
} as const;

export type DashboardCacheTagKey = keyof typeof DASHBOARD_CACHE_TAGS;

export function revalidateDashboardTag(key: DashboardCacheTagKey) {
  try {
    updateTag(DASHBOARD_CACHE_TAGS[key]);
  } catch {
    revalidateTag(DASHBOARD_CACHE_TAGS[key], "default");
  }
}

/**
 * Scholars & Cohorts summary stats.
 * Tag: dashboard:scholars
 */
export const getScholarsSummary = unstable_cache(
  async () => {
    const [scholarCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.role, "scholar"));

    const [cohortCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cohort)
      .where(eq(cohort.status, "active"));

    const [onboardedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(scholarProfile)
      .where(isNotNull(scholarProfile.onboardingCompletedAt));

    return {
      totalScholars: scholarCount?.count ?? 0,
      activeCohorts: cohortCount?.count ?? 0,
      onboardedScholars: onboardedCount?.count ?? 0,
    };
  },
  ["dashboard-scholars-summary"],
  {
    tags: [DASHBOARD_CACHE_TAGS.scholars],
    revalidate: 300,
  },
);

/**
 * Coaching & Sessions summary stats.
 * Tag: dashboard:sessions
 */
export const getSessionsSummary = unstable_cache(
  async () => {
    const now = new Date();

    const [totalSessions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(programmeSession);

    const [upcomingSessions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(programmeSession)
      .where(
        sql`${programmeSession.status} = 'scheduled' AND ${programmeSession.startsAt} >= ${now}`,
      );

    const [activeCoaches] = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.role, "coach"));

    return {
      totalSessions: totalSessions?.count ?? 0,
      upcomingSessions: upcomingSessions?.count ?? 0,
      activeCoaches: activeCoaches?.count ?? 0,
    };
  },
  ["dashboard-sessions-summary"],
  {
    tags: [DASHBOARD_CACHE_TAGS.sessions],
    revalidate: 300,
  },
);

/**
 * Editing Queue & Submissions summary stats.
 * Tag: dashboard:submissions
 */
export const getSubmissionsSummary = unstable_cache(
  async () => {
    const [totalSubmissions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(submission);

    const [inReviewSubmissions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(submission)
      .where(
        inArray(submission.status, [
          "submitted",
          "critical_review",
          "language_editing",
        ]),
      );

    const [completedSubmissions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(submission)
      .where(eq(submission.status, "returned"));

    return {
      totalSubmissions: totalSubmissions?.count ?? 0,
      inReview: inReviewSubmissions?.count ?? 0,
      completed: completedSubmissions?.count ?? 0,
    };
  },
  ["dashboard-submissions-summary"],
  {
    tags: [DASHBOARD_CACHE_TAGS.submissions],
    revalidate: 300,
  },
);

/**
 * Certificates summary stats.
 * Tag: dashboard:certificates
 */
export const getCertificatesSummary = unstable_cache(
  async () => {
    const [counts] = await db
      .select({
        eligible: sql<number>`sum(case when ${certificate.status} = 'eligible' then 1 else 0 end)`,
        pendingApproval: sql<number>`sum(case when ${certificate.status} = 'pending_approval' then 1 else 0 end)`,
        issued: sql<number>`sum(case when ${certificate.status} = 'issued' then 1 else 0 end)`,
      })
      .from(certificate);

    return {
      eligible: counts?.eligible ?? 0,
      pendingApproval: counts?.pendingApproval ?? 0,
      issued: counts?.issued ?? 0,
    };
  },
  ["dashboard-certificates-summary"],
  {
    tags: [DASHBOARD_CACHE_TAGS.certificates],
    revalidate: 300,
  },
);
