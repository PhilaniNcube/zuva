import { FileText, Download } from "lucide-react";

import { LocalTime } from "@/components/local-time";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { listScholarSubmissions } from "../submission-queries";

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
  critical_review: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
  language_editing: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20",
  returned: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  critical_review: "Critical Review",
  language_editing: "Language Editing",
  returned: "Returned",
};

export async function ScholarSubmissions({ scholarId }: { scholarId: string }) {
  const submissions = await listScholarSubmissions(scholarId);

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No submissions yet — upload a document above.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Reviewer</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((s) => (
          <TableRow key={s.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <FileText className="size-5" />
                </div>
                <span className="font-medium text-foreground text-sm">{s.title}</span>
              </div>
            </TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status]}`}
              >
                {STATUS_LABELS[s.status]}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <LocalTime value={s.createdAt} format="date" />
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{s.reviewerName ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">
              {s.dueAt ? <LocalTime value={s.dueAt} format="date" /> : "—"}
            </TableCell>
            <TableCell className="text-right">
              {s.status === "returned" && s.returnedFileKey ? (
                <a
                  href={`/api/files?key=${encodeURIComponent(s.returnedFileKey)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 text-xs" })}
                >
                  <Download className="size-3.5 text-primary" /> Download
                </a>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ScholarSubmissionsSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="mb-3 h-10 animate-pulse rounded-lg bg-muted/60"
        />
      ))}
    </div>
  );
}
