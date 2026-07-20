import { LocalTime } from "@/components/local-time";
import { SPECIALTIES, type Specialty } from "@/features/coach/specialties";

import { listOpenSlots } from "../session-queries";
import { BookSlotButton } from "./slot-buttons";

export async function BookingBrowser() {
  const slots = await listOpenSlots();

  if (slots.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No open slots right now — coaches publish availability regularly, so
        check back soon.
      </p>
    );
  }

  const byCoach = new Map<
    string,
    { coachName: string; specialty: Specialty | null; slots: typeof slots }
  >();
  for (const slot of slots) {
    const group = byCoach.get(slot.coachId) ?? {
      coachName: slot.coachName,
      specialty: slot.specialty,
      slots: [],
    };
    group.slots.push(slot);
    byCoach.set(slot.coachId, group);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[...byCoach.values()].map((group) => (
        <div
          key={group.coachName}
          className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <p className="font-medium">{group.coachName}</p>
          <p className="mb-3 text-xs text-zinc-500">
            {group.specialty ? SPECIALTIES[group.specialty] : "Coach"}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.slots.map((slot) => (
              <BookSlotButton key={slot.slotId} slotId={slot.slotId}>
                <LocalTime value={slot.startsAt} /> –{" "}
                <LocalTime value={slot.endsAt} format="time" />
              </BookSlotButton>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BookingBrowserSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
        />
      ))}
    </div>
  );
}
