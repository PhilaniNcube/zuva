"use client";

import { useState } from "react";

import { LocalTime } from "@/components/local-time";
import { SPECIALTIES, type Specialty } from "@/features/coach/specialties";

import { BookSlotButton } from "./slot-buttons";

export interface OpenSlotItem {
  slotId: string;
  startsAt: Date;
  endsAt: Date;
  coachId: string;
  coachName: string;
  specialty: Specialty | null;
}

export interface CoachingTopic {
  id: string;
  name: string;
}

export function BookingBrowserClient({
  slots,
  topics,
}: {
  slots: OpenSlotItem[];
  topics: CoachingTopic[];
}) {
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");

  const byCoach = new Map<string, { coachName: string; specialty: Specialty | null; slots: OpenSlotItem[] }>();
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-500">Topic:</span>
        {topics.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTopicId(t.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              topicId === t.id
                ? "bg-primary text-primary-foreground"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

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
                <BookSlotButton
                  key={slot.slotId}
                  slotId={slot.slotId}
                  sessionTypeId={topicId}
                  disabled={!topicId}
                >
                  <LocalTime value={slot.startsAt} /> –{" "}
                  <LocalTime value={slot.endsAt} format="time" />
                </BookSlotButton>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
