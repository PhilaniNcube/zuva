import Link from "next/link";

import { LocalTime } from "@/components/local-time";

import { listCohortSessions } from "../session-queries";

const TYPE_STYLES: Record<string, string> = {
  orientation:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  masterclass:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
};

export async function CohortSessions({ cohortId }: { cohortId: string }) {
  const sessions = await listCohortSessions(cohortId);

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No masterclasses or orientations scheduled yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="px-4 py-2 font-medium">Session</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Coach</th>
            <th className="px-4 py-2 font-medium">When</th>
            <th className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr
              key={s.id}
              className="border-t border-zinc-100 dark:border-zinc-800"
            >
              <td className="px-4 py-2">
                <Link
                  href={`/sessions/${s.id}`}
                  className="font-medium underline underline-offset-2"
                >
                  {s.title}
                </Link>
              </td>
              <td className="px-4 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[s.type]}`}
                >
                  {s.type}
                </span>
              </td>
              <td className="px-4 py-2">{s.coachName ?? "—"}</td>
              <td className="px-4 py-2">
                <LocalTime value={s.startsAt} />
              </td>
              <td className="px-4 py-2 text-zinc-500">{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CohortSessionsSkeleton() {
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
