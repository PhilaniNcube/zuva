import { LocalTime } from "@/components/local-time";

import { listAllResources, listResourcesForCohort } from "../resource-queries";

import { DeleteResourceButton } from "./delete-resource-button";

export async function ResourceList({
  cohortId,
  adminControls = false,
}: {
  cohortId: string | null;
  adminControls?: boolean;
}) {
  const resources = cohortId
    ? await listResourcesForCohort(cohortId)
    : await listAllResources();

  if (resources.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No resources published yet.</p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {resources.map((r) => (
        <div
          key={r.id}
          className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <p className="font-medium">{r.title}</p>
          {r.description ? (
            <p className="mt-1 text-xs text-zinc-500">{r.description}</p>
          ) : null}
          <p className="mt-1 text-xs text-zinc-400">
            {r.cohortId ? "Cohort-specific" : "Global"} ·{" "}
            {r.uploadedByName ?? "Unknown"} ·{" "}
            <LocalTime value={r.createdAt} format="date" />
          </p>
          <div className="mt-3 flex items-center gap-2">
            <a
              href={`/api/files?key=${encodeURIComponent(r.fileKey)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700"
            >
              Download
            </a>
            {adminControls ? <DeleteResourceButton resourceId={r.id} /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResourceListSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
        />
      ))}
    </div>
  );
}
