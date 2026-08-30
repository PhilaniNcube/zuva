import { listCoaches, listCoachWorkingHours } from "@/features/coach/coach-queries";
import type { WorkingHoursInput } from "@/features/coach/working-hours";
import {
  listOpenSlots,
  listScholarBookings,
  listScholarCohortSessions,
  listSessionTypes,
} from "../session-queries";
import { BookingCalendarClient } from "./booking-calendar-client";

export async function BookingBrowser({ scholarId }: { scholarId: string }) {
  const [slots, topics, coaches, coachWorkingHours, myBookings, cohortSessions] =
    await Promise.all([
      listOpenSlots(),
      listSessionTypes({ kind: "coaching" }),
      listCoaches(),
      listCoachWorkingHours(),
      listScholarBookings(scholarId),
      listScholarCohortSessions(scholarId),
    ]);

  if (topics.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No coaching session types are available yet — please contact the
        programme team.
      </p>
    );
  }

  const workingHoursByCoach: Record<string, WorkingHoursInput | null> = {};
  for (const row of coachWorkingHours) {
    workingHoursByCoach[row.coachId] = (row.workingHours as WorkingHoursInput) ?? null;
  }

  return (
    <BookingCalendarClient
      slots={slots}
      topics={topics}
      coaches={coaches}
      myBookings={myBookings}
      cohortSessions={cohortSessions}
      workingHoursByCoach={workingHoursByCoach}
    />
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
