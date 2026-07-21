import "server-only";

import { cache } from "react";
import { asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  attendance,
  certificate,
  cohort,
  feedbackSubmission,
  programmeSession,
  scholarProfile,
  submission,
  user,
} from "@/lib/db/schema";

/** Cohort overview: scholar count, feedback completion, certificate status. */
export const listCohortOverview = cache(async () => {
  const cohorts = await db
    .select({
      id: cohort.id,
      name: cohort.name,
      status: cohort.status,
    })
    .from(cohort)
    .orderBy(asc(cohort.name));

  const results = [];
  for (const c of cohorts) {
    // Scholar count
    const [scholarCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(scholarProfile)
      .where(eq(scholarProfile.cohortId, c.id));

    // Feedback count
    const [feedbackCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(feedbackSubmission)
      .innerJoin(user, eq(user.id, feedbackSubmission.scholarId))
      .innerJoin(scholarProfile, eq(scholarProfile.userId, user.id))
      .where(eq(scholarProfile.cohortId, c.id));

    // Certificate counts
    const [certCounts] = await db
      .select({
        eligible: sql<number>`sum(case when ${certificate.status} = 'eligible' then 1 else 0 end)`,
        pending: sql<number>`sum(case when ${certificate.status} = 'pending_approval' then 1 else 0 end)`,
        issued: sql<number>`sum(case when ${certificate.status} = 'issued' then 1 else 0 end)`,
      })
      .from(certificate)
      .where(eq(certificate.cohortId, c.id));

    results.push({
      ...c,
      scholarCount: scholarCount?.count ?? 0,
      feedbackCount: feedbackCount?.count ?? 0,
      certificates: {
        eligible: certCounts?.eligible ?? 0,
        pending: certCounts?.pending ?? 0,
        issued: certCounts?.issued ?? 0,
      },
    });
  }
  return results;
});

/** Feedback summary: average rating, total submissions, by session type. */
export const getFeedbackSummary = cache(async () => {
  const [totals] = await db
    .select({
      count: sql<number>`count(*)`,
      avgRating: sql<number>`avg(cast(json_extract(${feedbackSubmission.responses}, '$.rating') as real))`,
    })
    .from(feedbackSubmission);

  const byType = await db
    .select({
      type: programmeSession.type,
      count: sql<number>`count(*)`,
      avgRating: sql<number>`avg(cast(json_extract(${feedbackSubmission.responses}, '$.rating') as real))`,
    })
    .from(feedbackSubmission)
    .innerJoin(
      programmeSession,
      eq(programmeSession.id, feedbackSubmission.sessionId),
    )
    .groupBy(programmeSession.type);

  return {
    total: totals?.count ?? 0,
    avgRating: totals?.avgRating ?? 0,
    byType: byType.map((t) => ({
      type: t.type,
      count: t.count,
      avgRating: Math.round((t.avgRating ?? 0) * 10) / 10,
    })),
  };
});

/** Submission stats: count by status. */
export const getSubmissionStats = cache(async () => {
  const rows = await db
    .select({
      status: submission.status,
      count: sql<number>`count(*)`,
    })
    .from(submission)
    .groupBy(submission.status);

  const result: Record<string, number> = {
    submitted: 0,
    critical_review: 0,
    language_editing: 0,
    returned: 0,
  };
  for (const r of rows) {
    result[r.status] = r.count;
  }
  return result;
});

/** Attendance summary: sessions by type, attendance rate. */
export const getAttendanceSummary = cache(async () => {
  const sessions = await db
    .select({
      type: programmeSession.type,
      count: sql<number>`count(*)`,
    })
    .from(programmeSession)
    .groupBy(programmeSession.type);

  const attendanceByType = await db
    .select({
      type: programmeSession.type,
      count: sql<number>`count(*)`,
    })
    .from(attendance)
    .innerJoin(
      programmeSession,
      eq(programmeSession.id, attendance.sessionId),
    )
    .groupBy(programmeSession.type);

  return {
    sessions: sessions.map((s) => ({ type: s.type, count: s.count })),
    attendance: attendanceByType.map((a) => ({
      type: a.type,
      count: a.count,
    })),
  };
});

/** Recent activity: latest feedback + submissions + certificates. */
export const getRecentActivity = cache(async () => {
  const recentFeedback = await db
    .select({
      id: feedbackSubmission.id,
      scholarName: user.name,
      submittedAt: feedbackSubmission.submittedAt,
      sessionTitle: programmeSession.title,
    })
    .from(feedbackSubmission)
    .innerJoin(user, eq(user.id, feedbackSubmission.scholarId))
    .innerJoin(
      programmeSession,
      eq(programmeSession.id, feedbackSubmission.sessionId),
    )
    .orderBy(desc(feedbackSubmission.submittedAt))
    .limit(5);

  const recentSubmissions = await db
    .select({
      id: submission.id,
      title: submission.title,
      status: submission.status,
      createdAt: submission.createdAt,
      scholarName: user.name,
    })
    .from(submission)
    .innerJoin(user, eq(user.id, submission.scholarId))
    .orderBy(desc(submission.createdAt))
    .limit(5);

  return { recentFeedback, recentSubmissions };
});
