"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Search, X } from "lucide-react";

import { LocalTime } from "@/components/local-time";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ScholarSubmissionItem {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  dueAt: Date | null;
  returnedFileKey: string | null;
  reviewerName: string | null;
}

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

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

/**
 * Client-side search and status filtering for the scholar's submission list.
 * All filtering happens in-memory against the rows already fetched for this
 * scholar — no extra round trips.
 */
export function ScholarSubmissionsTable({
  submissions,
}: {
  submissions: ScholarSubmissionItem[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return submissions.filter((submission) => {
      if (status !== "all" && submission.status !== status) return false;
      if (!term) return true;
      const statusLabel = STATUS_LABELS[submission.status] ?? submission.status;
      return (
        submission.title.toLowerCase().includes(term) ||
        statusLabel.toLowerCase().includes(term) ||
        (submission.reviewerName?.toLowerCase().includes(term) ?? false)
      );
    });
  }, [submissions, search, status]);

  const hasFilters = search.trim() !== "" || status !== "all";

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No submissions yet — upload a document above.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-xs">
        <div className="flex min-w-[280px] flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, status, or reviewer..."
              aria-label="Search submissions"
              className="h-9 pl-9 text-xs"
            />
          </div>

          <Select
            items={STATUS_FILTER_OPTIONS}
            value={status}
            onValueChange={(value) => setStatus(value ?? "all")}
          >
            <SelectTrigger size="sm" className="h-9 w-[180px] text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent align="start">
              {STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatus("all");
              }}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 size-3" />
              Clear
            </Button>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground" aria-live="polite">
          Showing{" "}
          <span className="font-medium text-foreground">{filtered.length}</span>{" "}
          of <span className="font-medium text-foreground">{submissions.length}</span>{" "}
          submissions
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
          No submissions match your filters.
        </p>
      ) : (
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
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <FileText className="size-5" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {s.title}
                    </span>
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
                <TableCell className="text-xs text-muted-foreground">
                  {s.reviewerName ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.dueAt ? <LocalTime value={s.dueAt} format="date" /> : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {s.status === "returned" && s.returnedFileKey ? (
                    <a
                      href={`/api/files?key=${encodeURIComponent(s.returnedFileKey)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                        className: "gap-1.5 text-xs",
                      })}
                    >
                      <Download className="size-3.5 text-primary" /> Download
                    </a>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
