import "server-only";

import { cache } from "react";
import { and, asc, desc, eq, gte, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  attendance,
  coachProfile,
  feedbackSubmission,
  masterclassPage,
  programmeSession,
  scholarEnrollment,
  sessionType,
  user,
} from "@/lib/db/schema";

export type MasterclassFacilitator = {
  name: string;
  image: string | null;
  bio: string | null;
  specialty: string | null;
};

export type MasterclassListItem = {
  slug: string;
  name: string;
  headline: string;
  summary: string | null;
  outcomes: string[];
  heroImageUrl: string | null;
  facilitator: MasterclassFacilitator | null;
};

export type MasterclassDetail = MasterclassListItem & {
  id: string;
  sessionTypeId: string;
};

const detailSelection = {
  id: masterclassPage.id,
  slug: masterclassPage.slug,
  sessionTypeId: masterclassPage.sessionTypeId,
  name: sessionType.name,
  headline: masterclassPage.headline,
  summary: masterclassPage.summary,
  outcomes: masterclassPage.outcomes,
  heroImageUrl: masterclassPage.heroImageUrl,
  facilitatorName: user.name,
  facilitatorImage: user.image,
  facilitatorBio: coachProfile.bio,
  facilitatorSpecialty: coachProfile.specialty,
  sortOrder: masterclassPage.sortOrder,
};

function toListItem(row: {
  slug: string;
  name: string;
  headline: string;
  summary: string | null;
  outcomes: string[] | null;
  heroImageUrl: string | null;
  facilitatorName: string | null;
}): MasterclassListItem {
  return {
    slug: row.slug,
    name: row.name,
    headline: row.headline,
    summary: row.summary,
    outcomes: row.outcomes ?? [],
    heroImageUrl: row.heroImageUrl,
    facilitator: row.facilitatorName
      ? {
          name: row.facilitatorName,
          image: null,
          bio: null,
          specialty: null,
        }
      : null,
  };
}

/** Published masterclass landing pages (for the index grid). */
export const listPublishedMasterclasses = cache(
  async (): Promise<MasterclassListItem[]> => {
    const rows = await db
      .select(detailSelection)
      .from(masterclassPage)
      .innerJoin(sessionType, eq(sessionType.id, masterclassPage.sessionTypeId))
      .leftJoin(user, eq(user.id, masterclassPage.facilitatorId))
      .leftJoin(
        coachProfile,
        eq(coachProfile.userId, masterclassPage.facilitatorId),
      )
      .where(eq(masterclassPage.isPublished, true))
      .orderBy(asc(masterclassPage.sortOrder), asc(sessionType.name));

    return rows.map((row) => ({
      ...toListItem(row),
      facilitator: row.facilitatorName
        ? {
            name: row.facilitatorName,
            image: row.facilitatorImage,
            bio: row.facilitatorBio,
            specialty: row.facilitatorSpecialty,
          }
        : null,
    }));
  },
);

/** A single published masterclass page by slug, or null. */
export const getMasterclassBySlug = cache(
  async (slug: string): Promise<MasterclassDetail | null> => {
    const [row] = await db
      .select(detailSelection)
      .from(masterclassPage)
      .innerJoin(sessionType, eq(sessionType.id, masterclassPage.sessionTypeId))
      .leftJoin(user, eq(user.id, masterclassPage.facilitatorId))
      .leftJoin(
        coachProfile,
        eq(coachProfile.userId, masterclassPage.facilitatorId),
      )
      .where(
        and(
          eq(masterclassPage.slug, slug),
          eq(masterclassPage.isPublished, true),
        ),
      );

    if (!row) return null;

    return {
      ...toListItem(row),
      id: row.id,
      sessionTypeId: row.sessionTypeId,
      facilitator: row.facilitatorName
        ? {
            name: row.facilitatorName,
            image: row.facilitatorImage,
            bio: row.facilitatorBio,
            specialty: row.facilitatorSpecialty,
          }
        : null,
    };
  },
);

export type MasterclassSessionInstance = {
  id: string;
  cohortId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  coachName: string | null;
};

/** Upcoming, non-cancelled sessions of a given masterclass type. */
export const listUpcomingSessionsForType = cache(
  async (sessionTypeId: string): Promise<MasterclassSessionInstance[]> => {
    return db
      .select({
        id: programmeSession.id,
        cohortId: programmeSession.cohortId,
        title: programmeSession.title,
        startsAt: programmeSession.startsAt,
        endsAt: programmeSession.endsAt,
        coachName: user.name,
      })
      .from(programmeSession)
      .leftJoin(user, eq(user.id, programmeSession.coachId))
      .where(
        and(
          eq(programmeSession.sessionTypeId, sessionTypeId),
          eq(programmeSession.status, "scheduled"),
          gte(programmeSession.startsAt, new Date()),
        ),
      )
      .orderBy(asc(programmeSession.startsAt));
  },
);

/**
 * The session a scholar can still give feedback for on a masterclass page:
 * the most recent past instance of this type that they attended (in one of
 * their cohorts) and have not yet reviewed.
 */
export const getMasterclassFeedbackPrompt = cache(
  async (
    sessionTypeId: string,
    scholarId: string,
  ): Promise<{
    sessionId: string;
    title: string;
    startsAt: Date;
    coachName: string | null;
  } | null> => {
    const [row] = await db
      .select({
        sessionId: programmeSession.id,
        title: programmeSession.title,
        startsAt: programmeSession.startsAt,
        coachName: user.name,
      })
      .from(programmeSession)
      .innerJoin(
        attendance,
        and(
          eq(attendance.sessionId, programmeSession.id),
          eq(attendance.scholarId, scholarId),
        ),
      )
      .innerJoin(
        scholarEnrollment,
        and(
          eq(scholarEnrollment.cohortId, programmeSession.cohortId),
          eq(scholarEnrollment.scholarId, scholarId),
        ),
      )
      .leftJoin(user, eq(user.id, programmeSession.coachId))
      .leftJoin(
        feedbackSubmission,
        and(
          eq(feedbackSubmission.sessionId, programmeSession.id),
          eq(feedbackSubmission.scholarId, scholarId),
        ),
      )
      .where(
        and(
          eq(programmeSession.sessionTypeId, sessionTypeId),
          isNull(feedbackSubmission.id),
        ),
      )
      .orderBy(desc(programmeSession.startsAt))
      .limit(1);

    return row ?? null;
  },
);
