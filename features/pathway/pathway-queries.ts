import "server-only";

import { cache } from "react";
import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  attendance,
  feedbackSubmission,
  pathwayStep,
  programmeSession,
} from "@/lib/db/schema";

export type PathwayProgressStep = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  sortOrder: number;
  completed: boolean;
  detail: string | null;
};

const FEEDBACK_THRESHOLD = 5;

/**
 * Computes a scholar's pathway progress from attendance + feedback data.
 * Each pathway step is satisfied by real activity (no pre-populated rows).
 */
export const getPathwayProgress = cache(
  async (scholarId: string, cohortId: string) => {
    // Get the cohort's pathway steps in order.
    const steps = await db
      .select()
      .from(pathwayStep)
      .where(eq(pathwayStep.cohortId, cohortId))
      .orderBy(asc(pathwayStep.sortOrder));

    if (steps.length === 0) return [];

    // Get all attended sessions with their types.
    const attended = await db
      .select({ type: programmeSession.type })
      .from(attendance)
      .innerJoin(
        programmeSession,
        eq(programmeSession.id, attendance.sessionId),
      )
      .where(eq(attendance.scholarId, scholarId));

    const attendedTypes = new Set(attended.map((a) => a.type));
    const masterclassCount = attended.filter(
      (a) => a.type === "masterclass",
    ).length;

    // Get feedback count.
    const [fbRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(feedbackSubmission)
      .where(eq(feedbackSubmission.scholarId, scholarId));
    const feedbackCount = fbRow?.count ?? 0;

    return steps.map((step): PathwayProgressStep => {
      let completed = false;
      let detail: string | null = null;

      switch (step.kind) {
        case "orientation":
          completed = attendedTypes.has("orientation");
          detail = completed ? "Attended" : null;
          break;
        case "masterclass":
          completed = masterclassCount > 0;
          detail = completed
            ? `${masterclassCount} attended`
            : null;
          break;
        case "coaching":
          completed = attendedTypes.has("coaching_1on1");
          detail = completed ? "Attended" : null;
          break;
        case "feedback":
          completed = feedbackCount >= FEEDBACK_THRESHOLD;
          detail = `${feedbackCount} / ${FEEDBACK_THRESHOLD} submitted`;
          break;
      }

      return {
        id: step.id,
        title: step.title,
        description: step.description,
        kind: step.kind,
        sortOrder: step.sortOrder,
        completed,
        detail,
      };
    });
  },
);
