import { describe, expect, it } from "vitest";

import { parseIcalText } from "./ical-parser";

describe("iCal Parser", () => {
  it("parses all valid VEVENT entries as busy slots", () => {
    const sampleIcal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Example Corp.//EN
BEGIN:VEVENT
UID:123456789
DTSTART:20260801T090000Z
DTEND:20260801T100000Z
SUMMARY:ZUVA 1:1 Coaching Slot
END:VEVENT
BEGIN:VEVENT
UID:987654321
DTSTART:20260801T140000Z
DTEND:20260801T150000Z
SUMMARY:Personal Doctor Appointment
END:VEVENT
END:VCALENDAR`;

    const slots = parseIcalText(sampleIcal);
    expect(slots).toHaveLength(2);
    expect(slots[0].summary).toBe("ZUVA 1:1 Coaching Slot");
    expect(slots[1].summary).toBe("Personal Doctor Appointment");
  });

  it("returns empty array for calendar without events", () => {
    const emptyIcal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Example Corp.//EN
END:VCALENDAR`;

    const slots = parseIcalText(emptyIcal);
    expect(slots).toHaveLength(0);
  });
});

