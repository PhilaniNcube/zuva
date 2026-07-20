import { LocalTime } from "@/components/local-time";

import { listCoachSessions } from "../session-queries";
import { JoinCallButton } from "./join-call-button";

export async function CoachSessions({ coachId }: { coachId: string }) {
  const sessions = await listCoachSessions(coachId);

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No masterclasses or orientations assigned to you yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="px-4 py-2 font-medium">Session</th>
            <th className="px-4 py-2 font-medium">Cohort</th>
            <th className="px-4 py-2 font-medium">When</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr
              key={s.id}
              className="border-t border-zinc-100 dark:border-zinc-800"
            >
              <td className="px-4 py-2">
                <span className="font-medium">{s.title}</span>{" "}
                <span className="text-xs text-zinc-500">({s.type})</span>
              </td>
              <td className="px-4 py-2">{s.cohortName}</td>
              <td className="px-4 py-2">
                <LocalTime value={s.startsAt} />
              </td>
              <td className="px-4 py-2 text-zinc-500">{s.status}</td>
              <td className="px-4 py-2 text-right">
                {s.status === "scheduled" ? (
                  <JoinCallButton
                    sessionId={s.id}
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

export function CoachSessionsSkeleton() {
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
