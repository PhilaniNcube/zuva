import { google, type calendar_v3 } from "googleapis";

/**
 * Google Calendar / Meet integration via the single programme account
 * (OAuth refresh token in env vars). When credentials are absent (local dev)
 * every function degrades gracefully to a no-op so the rest of the booking
 * flow still works — sessions just have no Meet link.
 */

function getCalendar(): {
  calendar: calendar_v3.Calendar;
  calendarId: string;
} | null {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    GOOGLE_CALENDAR_ID,
  } = process.env;
  if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_REFRESH_TOKEN ||
    !GOOGLE_CALENDAR_ID
  ) {
    return null;
  }
  const oauth2 = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
  );
  oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return {
    calendar: google.calendar({ version: "v3", auth: oauth2 }),
    calendarId: GOOGLE_CALENDAR_ID,
  };
}

export async function createMeetEvent(input: {
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt: Date;
}): Promise<{ eventId: string; meetLink: string } | null> {
  const ctx = getCalendar();
  if (!ctx) {
    console.warn(
      "[google-calendar] credentials not configured — session will have no Meet link",
    );
    return null;
  }
  const res = await ctx.calendar.events.insert({
    calendarId: ctx.calendarId,
    conferenceDataVersion: 1,
    requestBody: {
      summary: input.title,
      description: input.description ?? undefined,
      start: { dateTime: input.startsAt.toISOString() },
      end: { dateTime: input.endsAt.toISOString() },
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });
  const eventId = res.data.id ?? null;
  const meetLink =
    res.data.hangoutLink ??
    res.data.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video",
    )?.uri ??
    null;
  if (!eventId || !meetLink) return null;
  return { eventId, meetLink };
}

export async function cancelMeetEvent(eventId: string): Promise<void> {
  const ctx = getCalendar();
  if (!ctx) return;
  try {
    await ctx.calendar.events.delete({
      calendarId: ctx.calendarId,
      eventId,
    });
  } catch {
    // Already deleted or never existed — nothing to do.
  }
}
