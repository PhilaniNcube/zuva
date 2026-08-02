import { CheckCircle2, Clock, Users } from "lucide-react";
import type { ScholarEngagementStat } from "../resource-queries";

export function ResourceEngagementSummary({
  stats,
}: {
  stats: ScholarEngagementStat[];
}) {
  if (stats.length === 0) return null;

  const totalScholars = stats.length;
  const completedScholars = stats.filter((s) => s.isFullyCompleted).length;
  const partialScholars = stats.filter((s) => !s.isFullyCompleted && s.resourcesViewed > 0).length;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">
            Pre-Session Scholar Preparation
          </h3>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {completedScholars} of {totalScholars} scholars completed all materials
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{
            width: `${totalScholars > 0 ? (completedScholars / totalScholars) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Scholar List */}
      <div className="divide-y divide-border/60 border rounded-lg border-border/60 overflow-hidden text-xs">
        {stats.map((s) => (
          <div
            key={s.scholarId}
            className="flex items-center justify-between p-3 bg-card hover:bg-muted/30 transition-colors"
          >
            <div>
              <p className="font-medium text-foreground">{s.scholarName}</p>
              <p className="text-muted-foreground text-[11px]">{s.scholarEmail}</p>
            </div>

            <div>
              {s.isFullyCompleted ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  Completed ({s.resourcesCompleted}/{s.resourcesTotal})
                </span>
              ) : s.resourcesViewed > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 font-medium text-amber-700 dark:text-amber-400">
                  <Clock className="size-3" />
                  In Progress ({s.resourcesCompleted}/{s.resourcesTotal})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border/60 px-2.5 py-0.5 font-medium text-muted-foreground">
                  Not started (0/{s.resourcesTotal})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
