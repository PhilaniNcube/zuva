import "server-only";

import { cache } from "react";
import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { coachProfile, user } from "@/lib/db/schema";

export const listCoaches = cache(async () => {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      specialty: coachProfile.specialty,
      whatsappNumber: coachProfile.whatsappNumber,
      bio: coachProfile.bio,
    })
    .from(coachProfile)
    .innerJoin(user, eq(user.id, coachProfile.userId))
    .orderBy(asc(user.name));
});

export const getCoachProfile = cache(async (userId: string) => {
  const [profile] = await db
    .select({
      id: coachProfile.id,
      userId: coachProfile.userId,
      specialty: coachProfile.specialty,
      whatsappNumber: coachProfile.whatsappNumber,
      bio: coachProfile.bio,
      icalUrl: coachProfile.icalUrl,
      workingHours: coachProfile.workingHours,
      lastSyncedAt: coachProfile.lastSyncedAt,
    })
    .from(coachProfile)
    .where(eq(coachProfile.userId, userId));
  return profile ?? null;
});

