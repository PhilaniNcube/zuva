import { listCoaches } from "@/features/coach/coach-queries";
import { listOpenSlots, listSessionTypes } from "../session-queries";
import { BookingBrowserClient } from "./booking-browser-client";

export async function BookingBrowser() {
  const [slots, topics, coaches] = await Promise.all([
    listOpenSlots(),
    listSessionTypes({ kind: "coaching" }),
    listCoaches(),
  ]);

  if (topics.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No coaching session types are available yet — please contact the
        programme team.
      </p>
    );
  }

  return (
    <BookingBrowserClient
      slots={slots}
      topics={topics}
      coaches={coaches}
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
