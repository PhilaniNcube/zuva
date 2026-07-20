import Link from "next/link";

import { LocalTime } from "@/components/local-time";

import { listScholarBookings } from "../session-queries";
import { CancelBookingButton } from "./slot-buttons";

export async function MyBookings({ scholarId }: { scholarId: string }) {
  const bookings = await listScholarBookings(scholarId);

  if (bookings.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No 1:1 bookings yet — pick a slot below.
      </p>
    );
  }

  const now = new Date();

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="px-4 py-2 font-medium">Session</th>
            <th className="px-4 py-2 font-medium">Coach</th>
            <th className="px-4 py-2 font-medium">When</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr
              key={b.bookingId}
              className="border-t border-zinc-100 dark:border-zinc-800"
            >
              <td className="px-4 py-2">
                <Link
                  href={`/sessions/${b.sessionId}`}
                  className="font-medium underline underline-offset-2"
                >
                  {b.title}
                </Link>
              </td>
              <td className="px-4 py-2">{b.coachName ?? "—"}</td>
              <td className="px-4 py-2">
                <LocalTime value={b.startsAt} />
              </td>
              <td className="px-4 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    b.bookingStatus === "confirmed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {b.bookingStatus}
                </span>
              </td>
              <td className="px-4 py-2 text-right">
                {b.bookingStatus === "confirmed" && b.startsAt > now ? (
                  <CancelBookingButton bookingId={b.bookingId} />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MyBookingsSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="mb-2 h-8 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
        />
      ))}
    </div>
  );
}
