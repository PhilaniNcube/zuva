import "server-only";

import { cache } from "react";
import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  attendance,
  feedbackSubmission,
  programmeSession,
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
        type: programmeSession.type,
        startsAt: programmeSession.startsAt,
        endsAt: programmeSession.endsAt,
        coachName: user.name,
      })
      .from(attendance)
      .innerJoin(
        programmeSession,
        eq(programmeSession.id, attendance.sessionId),
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
