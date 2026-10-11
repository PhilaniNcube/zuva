import { listScholarSubmissions } from "../submission-queries";
import { ScholarSubmissionsTable } from "./scholar-submissions-table";

export async function ScholarSubmissions({ scholarId }: { scholarId: string }) {
  const submissions = await listScholarSubmissions(scholarId);

  return <ScholarSubmissionsTable submissions={submissions} />;
}

export function ScholarSubmissionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-16 animate-pulse rounded-lg border bg-card p-3" />
      <div className="rounded-xl border border-border/60 bg-card p-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="mb-3 h-10 animate-pulse rounded-lg bg-muted/60"
          />
        ))}
      </div>
    </div>
  );
}
