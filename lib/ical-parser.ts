import ical from "node-ical";

export interface CalendarSlot {
  start: Date;
  end: Date;
  summary?: string;
  isZuvaSlot: boolean;
}

/**
 * Fetches an external iCal feed URL and extracts all calendar slots.
 * Automatically converts webcal:// to https:// and sets a 10s timeout.
 */
export async function fetchIcalCalendarSlots(
  icalUrl: string,
): Promise<CalendarSlot[]> {
  const cleanUrl = icalUrl.trim().replace(/^webcal:\/\//i, "https://");

  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    throw new Error("Invalid iCal URL scheme. Must start with http:// or https://");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "ZUVA-Scholar-Hub/1.0" },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Failed to fetch iCal feed (HTTP ${res.status})`);
    }

    const text = await res.text();
    return parseIcalText(text);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Calendar feed request timed out after 10 seconds");
    }
    throw new Error(
      err instanceof Error ? err.message : "Failed to parse iCal feed",
    );
  }
}

/**
 * Parses raw iCal string data into calendar slots, marking #zuva tagged events.
 */
export function parseIcalText(icalData: string): CalendarSlot[] {
  const parsed = ical.parseICS(icalData);
  const slots: CalendarSlot[] = [];

  const now = new Date();
  const horizonEnd = new Date();
  horizonEnd.setDate(now.getDate() + 60); // 60 days lookahead

  for (const k of Object.keys(parsed)) {
    const ev = parsed[k];
    if (ev && ev.type === "VEVENT" && ev.start && ev.end) {
      const start = new Date(ev.start);
      const end = new Date(ev.end);

      const summary = typeof ev.summary === "string" ? ev.summary : "";
      const description = typeof ev.description === "string" ? ev.description : "";
      const textToSearch = `${summary} ${description}`.toLowerCase();

      // Event is recognized as a ZUVA availability slot if title or description contains "zuva" or "#zuva"
      // Or if all events in dedicated calendar are imported
      const isZuvaSlot =
        textToSearch.includes("zuva") ||
        textToSearch.includes("#zuva") ||
        textToSearch.includes("coaching");

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        slots.push({ start, end, summary, isZuvaSlot });
      }

      // Handle recurring rules (RRULE)
      if (ev.rrule) {
        try {
          const occurrences = ev.rrule.between(now, horizonEnd, true);
          const durationMs = end.getTime() - start.getTime();
          for (const occ of occurrences) {
            slots.push({
              start: occ,
              end: new Date(occ.getTime() + durationMs),
              summary,
              isZuvaSlot,
            });
          }
        } catch {
          // Skip unparseable recurrence rules gracefully
        }
      }
    }
  }

  return slots;
}
