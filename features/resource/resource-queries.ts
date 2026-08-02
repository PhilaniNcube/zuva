import "server-only";

import { cache } from "react";
import { and, desc, eq, isNull, or } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  booking,
  programmeSession,
  resource,
  resourceEngagement,
  scholarProfile,
  sessionType,
  user,
} from "@/lib/db/schema";

export type SessionResourceItem = {
  id: string;
  title: string;
  description: string | null;
  type: "document" | "video" | "link";
  fileKey: string | null;
  url: string | null;
  cohortId: string | null;
  sessionId: string | null;
  createdAt: Date;
  uploadedByName: string | null;
  uploadedById: string | null;
  isViewed?: boolean;
  viewedAt?: Date | null;
  isCompleted?: boolean;
  completedAt?: Date | null;
};

/** List all resources for a specific programme session, optionally including engagement state for a scholar. */
export const listResourcesForSession = cache(
  async (
    sessionId: string,
    scholarId?: string,
  ): Promise<SessionResourceItem[]> => {
    const rows = await db
      .select({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        type: resource.type,
        fileKey: resource.fileKey,
        url: resource.url,
        cohortId: resource.cohortId,
        sessionId: resource.sessionId,
        createdAt: resource.createdAt,
        uploadedByName: user.name,
        uploadedById: resource.uploadedBy,
        viewedAt: resourceEngagement.viewedAt,
        completedAt: resourceEngagement.completedAt,
      })
      .from(resource)
      .leftJoin(user, eq(user.id, resource.uploadedBy))
      .leftJoin(
        resourceEngagement,
        and(
          eq(resourceEngagement.resourceId, resource.id),
          scholarId ? eq(resourceEngagement.scholarId, scholarId) : eq(resourceEngagement.scholarId, ""),
        ),
      )
      .where(eq(resource.sessionId, sessionId))
      .orderBy(desc(resource.createdAt));

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      type: r.type as "document" | "video" | "link",
      fileKey: r.fileKey,
      url: r.url,
      cohortId: r.cohortId,
      sessionId: r.sessionId,
      createdAt: r.createdAt,
      uploadedByName: r.uploadedByName,
      uploadedById: r.uploadedById,
      isViewed: !!r.viewedAt,
      viewedAt: r.viewedAt ?? null,
      isCompleted: !!r.completedAt,
      completedAt: r.completedAt ?? null,
    }));
  },
);

/** Resources for a given cohort (including global ones where cohortId is null). */
export const listResourcesForCohort = cache(async (cohortId: string) => {
  return db
    .select({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      fileKey: resource.fileKey,
      url: resource.url,
      cohortId: resource.cohortId,
      sessionId: resource.sessionId,
      createdAt: resource.createdAt,
      uploadedByName: user.name,
    })
    .from(resource)
    .leftJoin(user, eq(user.id, resource.uploadedBy))
    .where(
      or(
        eq(resource.cohortId, cohortId),
        isNull(resource.cohortId),
      ),
    )
    .orderBy(desc(resource.createdAt));
});

/** All resources (admin view). */
export const listAllResources = cache(async () => {
  return db
    .select({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      fileKey: resource.fileKey,
      url: resource.url,
      cohortId: resource.cohortId,
      sessionId: resource.sessionId,
      createdAt: resource.createdAt,
      uploadedByName: user.name,
    })
    .from(resource)
    .leftJoin(user, eq(user.id, resource.uploadedBy))
    .orderBy(desc(resource.createdAt));
});

export type ScholarEngagementStat = {
  scholarId: string;
  scholarName: string;
  scholarEmail: string;
  resourcesTotal: number;
  resourcesViewed: number;
  resourcesCompleted: number;
  isFullyCompleted: boolean;
};

/** Pre-session resource engagement statistics for a session (coach & admin view). */
export const getSessionResourceEngagementStats = cache(
  async (sessionId: string): Promise<{
    resources: SessionResourceItem[];
    scholars: ScholarEngagementStat[];
  }> => {
    // 1. Fetch session
    const [sess] = await db
      .select({
        id: programmeSession.id,
        cohortId: programmeSession.cohortId,
        format: sessionType.format,
        scholarId: programmeSession.scholarId,
      })
      .from(programmeSession)
      .innerJoin(
        sessionType,
        eq(sessionType.id, programmeSession.sessionTypeId),
      )
      .where(eq(programmeSession.id, sessionId));

    if (!sess) return { resources: [], scholars: [] };

    // 2. Fetch session resources
    const resources = await listResourcesForSession(sessionId);
    if (resources.length === 0) return { resources: [], scholars: [] };

    // 3. Find relevant scholars
    let scholarUsers: { id: string; name: string; email: string }[] = [];

    if (sess.format === "one_on_one") {
      if (sess.scholarId) {
        scholarUsers = await db
          .select({ id: user.id, name: user.name, email: user.email })
          .from(user)
          .where(eq(user.id, sess.scholarId));
      } else {
        const bookings = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
          })
          .from(booking)
          .innerJoin(user, eq(user.id, booking.scholarId))
          .where(
            and(
              eq(booking.sessionId, sessionId),
              eq(booking.status, "confirmed"),
            ),
          );
        scholarUsers = bookings;
      }
    } else {
      scholarUsers = await db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .innerJoin(scholarProfile, eq(scholarProfile.userId, user.id))
        .where(eq(scholarProfile.cohortId, sess.cohortId));
    }

    if (scholarUsers.length === 0) return { resources, scholars: [] };

    // 4. Fetch all engagement records for this session
    const engagements = await db
      .select({
        resourceId: resourceEngagement.resourceId,
        scholarId: resourceEngagement.scholarId,
        viewedAt: resourceEngagement.viewedAt,
        completedAt: resourceEngagement.completedAt,
      })
      .from(resourceEngagement)
      .where(eq(resourceEngagement.sessionId, sessionId));

    const totalResources = resources.length;

    const scholarsStats: ScholarEngagementStat[] = scholarUsers.map((s) => {
      const scholarEng = engagements.filter((e) => e.scholarId === s.id);
      const viewedCount = scholarEng.filter((e) => !!e.viewedAt).length;
      const completedCount = scholarEng.filter((e) => !!e.completedAt).length;

      return {
        scholarId: s.id,
        scholarName: s.name,
        scholarEmail: s.email,
        resourcesTotal: totalResources,
        resourcesViewed: viewedCount,
        resourcesCompleted: completedCount,
        isFullyCompleted: totalResources > 0 && completedCount === totalResources,
      };
    });

    return { resources, scholars: scholarsStats };
  },
);
