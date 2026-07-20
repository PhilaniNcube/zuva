import Link from "next/link";

import { listCohorts } from "../cohort-queries";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  active:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
};

export async function CohortList() {
  const cohorts = await listCohorts();
  if (cohorts.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No cohorts yet — create the first intake above.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Starts</th>
            <th className="px-4 py-2 font-medium">Ends</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Scholars</th>
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c) => (
            <tr
              key={c.id}
              className="border-t border-zinc-100 dark:border-zinc-800"
            >
              <td className="px-4 py-2">
                <Link
                  href={`/cohorts/${c.id}`}
                  className="font-medium underline underline-offset-2"
                >
                  {c.name}
                </Link>
              </td>
              <td className="px-4 py-2">{formatDate(c.startsAt)}</td>
              <td className="px-4 py-2">{formatDate(c.endsAt)}</td>
              <td className="px-4 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status]}`}
                >
                  {c.status}
                </span>
              </td>
              <td className="px-4 py-2">{c.scholarCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CohortListSkeleton() {
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

function formatDate(d: Date | null) {
  return d ? d.toLocaleDateString("en-GB", { timeZone: "UTC" }) : "—";
}
