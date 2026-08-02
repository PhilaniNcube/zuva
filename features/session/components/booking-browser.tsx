import { listOpenSlots, listSessionTypes } from "../session-queries";
import { BookingBrowserClient } from "./booking-browser-client";

export async function BookingBrowser() {
  const [slots, topics] = await Promise.all([
    listOpenSlots(),
    listSessionTypes({ kind: "coaching" }),
  ]);

  if (slots.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No open slots right now — coaches publish availability regularly, so
        check back soon.
      </p>
    );
  }

  if (topics.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No coaching session types are available yet — please contact the
        programme team.
      </p>
    );
  }

  return <BookingBrowserClient slots={slots} topics={topics} />;
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
