/**
 * Idempotent data migration script: backfills existing `scholar_profile.cohort_id`
 * entries into the `scholar_enrollment` join table.
 *
 * Usage:
 *   npx tsx scripts/migrate-multi-cohort.ts
 */
import { isNotNull, eq } from "drizzle-orm";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fall back to environment variables
}

async function main() {
  const { db } = await import("../lib/db");
  const { scholarProfile, scholarEnrollment } = await import("../lib/db/schema");

  console.log("Starting multi-cohort data migration...");

  const profilesWithCohort = await db
    .select({
      id: scholarProfile.id,
      userId: scholarProfile.userId,
      cohortId: scholarProfile.cohortId,
      createdAt: scholarProfile.createdAt,
    })
    .from(scholarProfile)
    .where(isNotNull(scholarProfile.cohortId));

  console.log(`Found ${profilesWithCohort.length} scholar profiles with a cohortId.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const profile of profilesWithCohort) {
    if (!profile.cohortId) continue;

    const [existing] = await db
      .select()
      .from(scholarEnrollment)
      .where(
        eq(scholarEnrollment.scholarId, profile.userId) &&
        eq(scholarEnrollment.cohortId, profile.cohortId)
      );

    if (existing) {
      skippedCount++;
    } else {
      await db.insert(scholarEnrollment).values({
        scholarId: profile.userId,
        cohortId: profile.cohortId,
        enrolledAt: profile.createdAt || new Date(),
      }).onConflictDoNothing();
      migratedCount++;
    }
  }

  console.log(
    `Migration complete! Enrolled: ${migratedCount}, Already enrolled / skipped: ${skippedCount}`
  );
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
