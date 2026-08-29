import "server-only";

import { db } from "@/lib/db";
import { coachProfile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AVAILABILITY_STALE_MS } from "./working-hours";
import { syncCoachAvailabilityForUser } from "./coach-sync-actions";

export async function ensureCoachAvailabilityFresh(
  coachUserId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ lastSyncedAt: coachProfile.lastSyncedAt })
    .from(coachProfile)
    .where(eq(coachProfile.userId, coachUserId));

  const stale =
    !row?.lastSyncedAt ||
    Date.now() - row.lastSyncedAt.getTime() > AVAILABILITY_STALE_MS;

  if (!stale) return false;

  await syncCoachAvailabilityForUser(coachUserId);
  return true;
}
