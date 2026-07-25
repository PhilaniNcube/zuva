import { google, type calendar_v3 } from "googleapis";

/**
 * Google Calendar & Jitsi Meet Integration
 * Creates Google Calendar events with automatic email invitations sent to attendees,
 * while utilizing Jitsi Meet links so anyone (Google or non-Google users) can join
 * without needing host admission.
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
  attendees?: string[];
}): Promise<{ eventId: string; meetLink: string } | null> {
  const roomId = crypto.randomUUID();
  const meetLink = `https://meet.jit.si/zuva-${roomId}`;

  const ctx = getCalendar();
  if (!ctx) {
    console.warn(
      "[google-calendar] credentials not configured — fallback to local Jitsi link",
    );
    return { eventId: roomId, meetLink };
  }

  try {
    const descText = input.description
      ? `${input.description}\n\nJoin Video Call: ${meetLink}`
      : `Join Video Call: ${meetLink}`;

    const res = await ctx.calendar.events.insert({
      calendarId: ctx.calendarId,
      sendUpdates: "all", // Sends official calendar invite emails to attendees
      requestBody: {
        summary: input.title,
        location: meetLink,
        description: descText,
        start: { dateTime: input.startsAt.toISOString() },
        end: { dateTime: input.endsAt.toISOString() },
        attendees: input.attendees?.map((email) => ({ email })),
      },
    });

    const eventId = res.data.id ?? roomId;
    return { eventId, meetLink };
  } catch (err) {
    console.error("[google-calendar] Error creating calendar event:", err);
    // Fall back to returning the valid Jitsi link even if calendar insert fails
    return { eventId: roomId, meetLink };
  }
}

export async function cancelMeetEvent(eventId: string): Promise<void> {
  const ctx = getCalendar();
  if (!ctx) return;
  try {
    await ctx.calendar.events.delete({
      calendarId: ctx.calendarId,
      eventId,
      sendUpdates: "all",
    });
  } catch {
    // Already deleted or never existed — nothing to do.
  }
}
