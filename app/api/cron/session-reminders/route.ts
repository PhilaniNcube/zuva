import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import { programmeSession, sessionReminderSend } from "@/lib/db/schema";
import { sendSessionReminderEmail } from "@/lib/email";
import { buildSessionIcs } from "@/lib/ics";
import { getSessionAttendanceRoster } from "@/features/session/session-queries";

export const maxDuration = 60;

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

type ReminderWindow = "24h" | "1h";

/**
 * Hourly cron: send pre-session reminders (24h and 1h out) to the expected
 * audience, with an `.ics` attachment. Idempotent via `session_reminder_send`.
 */
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

  const now = Date.now();
  const horizonEnd = new Date(now + 26 * HOUR);

  const sessions = await db
    .select({
      id: programmeSession.id,
      title: programmeSession.title,
      description: programmeSession.description,
      startsAt: programmeSession.startsAt,
      endsAt: programmeSession.endsAt,
      meetLink: programmeSession.meetLink,
    })
    .from(programmeSession)
    .where(
      and(
        eq(programmeSession.status, "scheduled"),
        gte(programmeSession.startsAt, new Date(now)),
        lte(programmeSession.startsAt, horizonEnd),
      ),
    );

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const session of sessions) {
    const delta = session.startsAt.getTime() - now;
    let window: ReminderWindow | null = null;
    if (delta > 23 * HOUR && delta <= 24 * HOUR) window = "24h";
    else if (delta > 45 * MINUTE && delta <= 60 * MINUTE) window = "1h";
    if (!window) continue;

    const sessionUrl = `${baseUrl}/sessions/${session.id}`;
    const description = [
      session.description,
      session.meetLink ? `Join video call: ${session.meetLink}` : null,
    ]
      .filter((part): part is string => Boolean(part))
      .join("\n\n");

    const icsContent = buildSessionIcs({
      uid: session.id,
      title: session.title,
      description,
      location: session.meetLink,
      url: sessionUrl,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      reminderMinutes: window === "1h" ? 15 : 60,
    });

    const recipients = await getSessionAttendanceRoster(session.id);

    for (const recipient of recipients) {
      // Claim the send first so concurrent/duplicate runs can't double-send.
      const claimed = await db
        .insert(sessionReminderSend)
        .values({
          sessionId: session.id,
          userId: recipient.scholarId,
          window,
        })
        .onConflictDoNothing()
        .returning({ id: sessionReminderSend.id });

      if (claimed.length === 0) {
        skipped++;
        continue;
      }

      const result = await sendSessionReminderEmail({
        to: recipient.email,
        recipientName: recipient.name,
        sessionTitle: session.title,
        startsAt: session.startsAt,
        meetLink: session.meetLink,
        sessionUrl,
        window,
        icsContent,
        userId: recipient.scholarId,
      });

      if (result.sent) {
        sent++;
      } else {
        failed++;
        // Release the claim so a later run can retry.
        await db
          .delete(sessionReminderSend)
          .where(eq(sessionReminderSend.id, claimed[0].id));
      }
    }
  }

  return Response.json({
    ok: true,
    sent,
    skipped,
    failed,
    sessionsScanned: sessions.length,
  });
}
