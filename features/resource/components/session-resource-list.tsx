"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  FileText,
  Film,
  Globe,
  Trash2,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SessionResourceItem } from "../resource-queries";
import { deleteResource, trackResourceEngagement } from "../resource-actions";

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
      let id = "";
      if (parsed.hostname.includes("youtu.be")) {
        id = parsed.pathname.slice(1);
      } else {
        id = parsed.searchParams.get("v") || "";
      }
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("loom.com")) {
      const parts = parsed.pathname.split("/");
      const id = parts[parts.length - 1];
      return id ? `https://www.loom.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const parts = parsed.pathname.split("/");
      const id = parts[parts.length - 1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function SessionResourceList({
  resources,
  sessionId,
  canManage,
  isScholar,
}: {
  resources: SessionResourceItem[];
  sessionId: string;
  canManage: boolean;
  isScholar: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (resources.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No pre-session materials uploaded yet.
        </p>
      </div>
    );
  }

  const handleTrackView = (resourceId: string) => {
    if (!isScholar) return;
    startTransition(async () => {
      await trackResourceEngagement({
        resourceId,
        sessionId,
        action: "view",
      });
    });
  };

  const handleToggleComplete = (resourceId: string, currentCompleted: boolean) => {
    startTransition(async () => {
      const res = await trackResourceEngagement({
        resourceId,
        sessionId,
        action: "toggle",
      });
      if (res.ok) {
        toast.success(
          currentCompleted
            ? "Marked resource as incomplete"
            : "Marked pre-session resource as completed",
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this pre-session resource?")) return;
    startTransition(async () => {
      const res = await deleteResource(resourceId);
      if (res.ok) {
        toast.success("Pre-session resource deleted");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {resources.map((r) => {
        const embedUrl = r.url ? getEmbedUrl(r.url) : null;

        return (
          <div
            key={r.id}
            className="rounded-xl border border-border bg-card p-5 transition-all shadow-xs"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                  {r.type === "video" ? (
                    <Video className="size-5" />
                  ) : r.type === "link" ? (
                    <Globe className="size-5" />
                  ) : (
                    <FileText className="size-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-foreground text-sm">{r.title}</h4>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium capitalize">
                      {r.type}
                    </span>
                    {isScholar && r.isCompleted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="size-3" />
                        Completed
                      </span>
                    ) : isScholar && r.isViewed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                        Viewed
                      </span>
                    ) : null}
                  </div>

                  {r.description ? (
                    <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {r.description}
                    </p>
                  ) : null}
                </div>
              </div>

              {canManage ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(r.id)}
                  disabled={isPending}
                  className="text-muted-foreground hover:text-red-600"
                  title="Delete resource"
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>

            {/* Embedded Video Player if applicable */}
            {r.type === "video" && (
              <div className="mt-4 overflow-hidden rounded-lg border border-border bg-black/90">
                {embedUrl ? (
                  <div className="relative aspect-video w-full">
                    <iframe
                      src={embedUrl}
                      className="absolute inset-0 h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={() => handleTrackView(r.id)}
                    />
                  </div>
                ) : r.fileKey ? (
                  <video
                    controls
                    className="w-full max-h-96 rounded-lg"
                    onPlay={() => handleTrackView(r.id)}
                  >
                    <source src={`/api/files?key=${encodeURIComponent(r.fileKey)}`} />
                    Your browser does not support HTML5 video playback.
                  </video>
                ) : null}
              </div>
            )}

            {/* Actions Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
              <div className="flex items-center gap-2">
                {r.fileKey ? (
                  <a
                    href={`/api/files?key=${encodeURIComponent(r.fileKey)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleTrackView(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Download className="size-3.5 text-muted-foreground" />
                    {r.type === "video" ? "Download Video File" : "View / Download Document"}
                  </a>
                ) : r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleTrackView(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="size-3.5 text-muted-foreground" />
                    {r.type === "video" ? "Watch Video Link" : "Open Web Resource"}
                  </a>
                ) : null}
              </div>

              {isScholar ? (
                <button
                  type="button"
                  onClick={() => handleToggleComplete(r.id, !!r.isCompleted)}
                  disabled={isPending}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    r.isCompleted
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.isCompleted ? (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Circle className="size-4" />
                      Mark as Read / Done
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
