import { db } from "@/lib/db";
import { coachProfile } from "@/lib/db/schema";
import { syncCoachAvailabilityForUser } from "@/features/coach/coach-sync-actions";

export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  const coaches = await db
    .select({ userId: coachProfile.userId })
    .from(coachProfile);

  let synced = 0;
  let failed = 0;
  let totalSlotsCreated = 0;
  const errors: { userId: string; error: string }[] = [];

  for (const { userId } of coaches) {
    try {
      const result = await syncCoachAvailabilityForUser(userId);
      if (result.ok) {
        synced++;
        totalSlotsCreated += result.data.slotsCreated;
      } else {
        failed++;
        errors.push({ userId, error: result.error });
      }
    } catch (err) {
      failed++;
      errors.push({
        userId,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return Response.json({
    ok: true,
    synced,
    failed,
    totalSlotsCreated,
    totalCoaches: coaches.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
