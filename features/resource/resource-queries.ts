import "server-only";

import { cache } from "react";
import { desc, eq, inArray, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { resource, user } from "@/lib/db/schema";

/** Resources for a given cohort (including global ones where cohortId is null). */
export const listResourcesForCohort = cache(async (cohortId: string) => {
  return db
    .select({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      fileKey: resource.fileKey,
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
        eq(resource.cohortId, null as unknown as string),
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
      fileKey: resource.fileKey,
      cohortId: resource.cohortId,
      createdAt: resource.createdAt,
      uploadedByName: user.name,
    })
    .from(resource)
    .leftJoin(user, eq(user.id, resource.uploadedBy))
    .orderBy(desc(resource.createdAt));
});
