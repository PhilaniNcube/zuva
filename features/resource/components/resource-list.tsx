import { Download, ExternalLink, FileText, Globe, Video } from "lucide-react";
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
      <p className="text-sm text-muted-foreground">No resources published yet.</p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {resources.map((r) => (
        <div
          key={r.id}
          className="rounded-xl border border-border bg-card p-4 transition-all shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                {r.type === "video" ? (
                  <Video className="size-4" />
                ) : r.type === "link" ? (
                  <Globe className="size-4" />
                ) : (
                  <FileText className="size-4" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{r.title}</p>
                {r.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                ) : null}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {r.cohortId ? "Cohort resource" : "Global resource"} ·{" "}
              {r.uploadedByName ?? "System"} ·{" "}
              <LocalTime value={r.createdAt} format="date" />
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/60">
            {r.fileKey ? (
              <a
                href={`/api/files?key=${encodeURIComponent(r.fileKey)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Download className="size-3.5 text-muted-foreground" />
                Download
              </a>
            ) : r.url ? (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <ExternalLink className="size-3.5 text-muted-foreground" />
                Open Link
              </a>
            ) : null}
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
          className="h-28 animate-pulse rounded-xl bg-muted/60"
        />
      ))}
    </div>
  );
}
