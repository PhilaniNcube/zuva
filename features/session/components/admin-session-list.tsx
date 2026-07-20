import { LocalTime } from "@/components/local-time";

import { listAdminSessions } from "../session-queries";
import { CancelSessionButton } from "./slot-buttons";

export async function AdminSessionList() {
  const sessions = await listAdminSessions();

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No group sessions scheduled yet — create one above.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="px-4 py-2 font-medium">Title</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Cohort</th>
            <th className="px-4 py-2 font-medium">Coach</th>
            <th className="px-4 py-2 font-medium">When</th>
            <th className="px-4 py-2 font-medium">Meet</th>
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
              <td className="px-4 py-2 font-medium">{s.title}</td>
              <td className="px-4 py-2">{s.type}</td>
              <td className="px-4 py-2">{s.cohortName}</td>
              <td className="px-4 py-2">{s.coachName ?? "—"}</td>
              <td className="px-4 py-2">
                <LocalTime value={s.startsAt} />
              </td>
              <td className="px-4 py-2">
                {s.meetLink ? "✓" : <span className="text-zinc-400">pending</span>}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.status === "scheduled"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {s.status}
                </span>
              </td>
              <td className="px-4 py-2 text-right">
                {s.status === "scheduled" ? (
                  <CancelSessionButton sessionId={s.id} />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminSessionListSkeleton() {
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
