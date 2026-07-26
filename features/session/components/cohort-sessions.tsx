import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { LocalTime } from "@/components/local-time";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCohortSessions } from "../session-queries";

const TYPE_STYLES: Record<string, string> = {
  orientation: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20",
  masterclass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
};

export async function CohortSessions({ cohortId }: { cohortId: string }) {
  const sessions = await listCohortSessions(cohortId);

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No masterclasses or orientations scheduled yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Coach</TableHead>
          <TableHead>When</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((s) => (
          <TableRow key={s.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <CalendarDays className="size-5" />
                </div>
                <Link
                  href={`/sessions/${s.id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors text-sm"
                >
                  {s.title}
                </Link>
              </div>
            </TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${TYPE_STYLES[s.type] ?? "bg-muted text-muted-foreground border border-border/60"}`}
              >
                {s.type}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">{s.coachName ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">
              <LocalTime value={s.startsAt} />
            </TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  s.status === "scheduled"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-muted text-muted-foreground border border-border/60"
                }`}
              >
                {s.status}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CohortSessionsSkeleton() {
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
