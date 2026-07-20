import { LocalTime } from "@/components/local-time";

import { listCoachSlots } from "../session-queries";
import { JoinCallButton } from "./join-call-button";
import { CancelSlotButton } from "./slot-buttons";

export async function CoachSlots({ coachId }: { coachId: string }) {
  const slots = await listCoachSlots(coachId);
  const visible = slots.filter((s) => s.status !== "cancelled");

  if (visible.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No slots yet — publish your first availability above.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="px-4 py-2 font-medium">When</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Scholar</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {visible.map((s) => (
            <tr
              key={s.slotId}
              className="border-t border-zinc-100 dark:border-zinc-800"
            >
              <td className="px-4 py-2">
                <LocalTime value={s.startsAt} /> –{" "}
                <LocalTime value={s.endsAt} format="time" />
              </td>
              <td className="px-4 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.status === "booked"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  }`}
                >
                  {s.status}
                </span>
              </td>
              <td className="px-4 py-2">{s.scholarName ?? "—"}</td>
              <td className="px-4 py-2 text-right">
                {s.status === "open" ? (
                  <CancelSlotButton slotId={s.slotId} />
                ) : s.sessionId ? (
                  <JoinCallButton
                    sessionId={s.sessionId}
                    meetLinkAvailable={!!s.meetLink}
                  />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CoachSlotsSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="mb-2 h-8 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
        />
      ))}
    </div>
  );
}
