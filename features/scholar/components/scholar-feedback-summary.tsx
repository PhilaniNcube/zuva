import { MessageSquare, Star } from "lucide-react";

import { LocalTime } from "@/components/local-time";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getScholarFeedbackSummary } from "@/features/feedback/feedback-queries";

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`Rated ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-3.5 ${
            n <= rounded
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/40"
          }`}
        />
      ))}
    </span>
  );
}

export async function ScholarFeedbackSummary({
  scholarId,
}: {
  scholarId: string;
}) {
  const summary = await getScholarFeedbackSummary(scholarId);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          Feedback
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
            {summary.totalCount}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {summary.averageRating === null
                ? "—"
                : summary.averageRating}
            </div>
            <div className="text-xs text-muted-foreground">avg rating</div>
          </div>
          <div>
            {summary.averageRating !== null ? (
              <Stars value={summary.averageRating} />
            ) : (
              <p className="text-xs text-muted-foreground">
                No rated feedback yet
              </p>
            )}
            <div className="mt-1 text-xs text-muted-foreground">
              {summary.ratedCount} rated · {summary.totalCount} total
            </div>
          </div>
        </div>

        {summary.recent.length > 0 ? (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Recent comments
            </p>
            <ul className="space-y-3">
              {summary.recent.map((r) => (
                <li key={r.sessionId}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-foreground">
                      {r.sessionTitle}
                    </p>
                    <Stars value={r.rating} />
                  </div>
                  {r.comment ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {r.comment}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    <LocalTime value={r.submittedAt} />
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ScholarFeedbackSummarySkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-6">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}
