import { FileText } from "lucide-react";

import { LocalTime } from "@/components/local-time";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listScholarSubmissions } from "@/features/submission/submission-queries";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  critical_review: "Critical Review",
  language_editing: "Language Editing",
  returned: "Returned",
};

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
  critical_review: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
  language_editing: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20",
  returned: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
};

export async function ScholarSubmissions({ scholarId }: { scholarId: string }) {
  const submissions = await listScholarSubmissions(scholarId);

  const statusCounts = submissions.reduce<Record<string, number>>(
    (acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          Editing submissions
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
            {submissions.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No submissions yet.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <span
                  key={status}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border border-border/60"}`}
                >
                  {STATUS_LABELS[status] ?? status}
                  <span className="font-bold">{count}</span>
                </span>
              ))}
            </div>

            <div className="border-t border-border pt-3">
              <ul className="space-y-2.5">
                {submissions.slice(0, 6).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {s.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <LocalTime value={s.createdAt} format="date" />
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[s.status] ?? "bg-muted text-muted-foreground border border-border/60"}`}
                    >
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ScholarSubmissionsSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}
