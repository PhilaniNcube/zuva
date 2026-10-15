/**
 * Minimal RFC 5545 iCalendar (`.ics`) generator for session invites.
 *
 * Deliberately dependency-free: we only emit single `VEVENT`s for programme
 * sessions, so a full calendar library would be overkill. `lib/ical-parser.ts`
 * handles the opposite direction (parsing external feeds).
 */

/** Escape a value for use in an iCalendar text field (RFC 5545 §3.3.11). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Format an instant as a UTC iCalendar timestamp, e.g. `20261015T130000Z`. */
function formatUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Fold long content lines at 75 octets, continuing with a leading space. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks = [line.slice(0, 75)];
  let remaining = line.slice(75);
  while (remaining.length > 0) {
    chunks.push(" " + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  return chunks.join("\r\n");
}

export interface SessionIcsInput {
  /** Stable event UID — reuse the session id so re-downloads update the event. */
  uid: string;
  title: string;
  description?: string | null;
  /** Usually the video-call link. */
  location?: string | null;
  /** Canonical in-app URL for the session. */
  url?: string | null;
  startsAt: Date;
  endsAt: Date;
  organizerName?: string;
  organizerEmail?: string;
  /** Minutes before the start for the built-in DISPLAY alarm. */
  reminderMinutes?: number;
}

/** Build a single-event `.ics` document for a programme session. */
export function buildSessionIcs(input: SessionIcsInput): string {
  const now = formatUtc(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ZUVA Scholar Hub//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeText(input.uid)}@zuvacoaching.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatUtc(input.startsAt)}`,
    `DTEND:${formatUtc(input.endsAt)}`,
    `SUMMARY:${escapeText(input.title)}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
  ];

  if (input.description) {
    lines.push(`DESCRIPTION:${escapeText(input.description)}`);
  }
  if (input.location) {
    lines.push(`LOCATION:${escapeText(input.location)}`);
  }
  if (input.url) {
    lines.push(`URL:${escapeText(input.url)}`);
  }
  if (input.organizerEmail) {
    const cn = input.organizerName ? `;CN=${escapeText(input.organizerName)}` : "";
    lines.push(`ORGANIZER${cn}:mailto:${input.organizerEmail}`);
  }

  const reminderMinutes = input.reminderMinutes ?? 30;
  lines.push(
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(input.title)}`,
    `TRIGGER:-PT${reminderMinutes}M`,
    "END:VALARM",
  );

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
