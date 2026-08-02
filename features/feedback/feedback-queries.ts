import "server-only";

import { cache } from "react";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  attendance,
  feedbackSubmission,
  programmeSession,
  sessionType,
  user,
} from "@/lib/db/schema";

/** Check if a scholar already submitted feedback for a session. */
export const getFeedbackForSession = cache(
  async (sessionId: string, scholarId: string) => {
    const [row] = await db
      .select()
      .from(feedbackSubmission)
      .where(
        and(
          eq(feedbackSubmission.sessionId, sessionId),
          eq(feedbackSubmission.scholarId, scholarId),
        ),
      );
    return row ?? null;
  },
);

/** Total feedback forms submitted — used for the 5-form certificate count. */
export const getScholarFeedbackCount = cache(async (scholarId: string) => {
  const rows = await db
    .select({ id: feedbackSubmission.id })
    .from(feedbackSubmission)
    .where(eq(feedbackSubmission.scholarId, scholarId));
  return rows.length;
});

/**
 * Sessions the scholar attended (has attendance record) but hasn't submitted
 * feedback for. Drives the "share feedback" prompt on the sessions page.
 */
export const listAttendedSessionsNeedingFeedback = cache(
  async (scholarId: string) => {
    const attended = await db
      .select({
        sessionId: attendance.sessionId,
        title: programmeSession.title,
        typeName: sessionType.name,
        startsAt: programmeSession.startsAt,
        endsAt: programmeSession.endsAt,
        coachName: user.name,
      })
      .from(attendance)
      .innerJoin(
        programmeSession,
        eq(programmeSession.id, attendance.sessionId),
      )
      .innerJoin(
        sessionType,
        eq(sessionType.id, programmeSession.sessionTypeId),
      )
      .leftJoin(user, eq(user.id, programmeSession.coachId))
      .where(eq(attendance.scholarId, scholarId))
      .orderBy(desc(programmeSession.startsAt));

    if (attended.length === 0) return [];

    const sessionIds = attended.map((a) => a.sessionId);
    const submitted = await db
      .select({ sessionId: feedbackSubmission.sessionId })
      .from(feedbackSubmission)
      .where(
        and(
          eq(feedbackSubmission.scholarId, scholarId),
          inArray(feedbackSubmission.sessionId, sessionIds),
        ),
      );

    const submittedIds = new Set(submitted.map((s) => s.sessionId));
    return attended.filter((a) => !submittedIds.has(a.sessionId));
  },
);

export type ScholarFeedbackSummary = {
  totalCount: number;
  ratedCount: number;
  averageRating: number | null;
  recent: {
    sessionId: string;
    sessionTitle: string;
    startsAt: Date;
    rating: number;
    comment: string | null;
    submittedAt: Date;
  }[];
};

/**
 * Feedback aggregates for the admin scholar page. Anonymous submissions are
 * counted toward the total (drives the certificate threshold) but their
 * ratings and comments are withheld — anonymous feedback is never surfaced to
 * admins.
 */
export const getScholarFeedbackSummary = cache(
  async (scholarId: string): Promise<ScholarFeedbackSummary> => {
    const [totalRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(feedbackSubmission)
      .where(eq(feedbackSubmission.scholarId, scholarId));
    const totalCount = totalRow?.count ?? 0;

    const [ratedRow] = await db
      .select({
        count: sql<number>`count(*)`,
        avg: sql<number>`avg(json_extract(${feedbackSubmission.responses}, '$.rating'))`,
      })
      .from(feedbackSubmission)
      .where(
        and(
          eq(feedbackSubmission.scholarId, scholarId),
          eq(feedbackSubmission.isAnonymous, false),
        ),
      );

    const recent = await db
      .select({
        sessionId: feedbackSubmission.sessionId,
        sessionTitle: programmeSession.title,
        startsAt: programmeSession.startsAt,
        rating: sql<number>`json_extract(${feedbackSubmission.responses}, '$.rating')`,
        comment: sql<string | null>`json_extract(${feedbackSubmission.responses}, '$.comment')`,
        submittedAt: feedbackSubmission.submittedAt,
      })
      .from(feedbackSubmission)
      .innerJoin(
        programmeSession,
        eq(programmeSession.id, feedbackSubmission.sessionId),
      )
      .where(
        and(
          eq(feedbackSubmission.scholarId, scholarId),
          eq(feedbackSubmission.isAnonymous, false),
        ),
      )
      .orderBy(desc(feedbackSubmission.submittedAt))
      .limit(5);

    const ratedCount = ratedRow?.count ?? 0;
    return {
      totalCount,
      ratedCount,
      averageRating:
        ratedCount > 0
          ? Math.round(((ratedRow?.avg ?? 0) as number) * 10) / 10
          : null,
      recent: recent as ScholarFeedbackSummary["recent"],
    };
  },
);
