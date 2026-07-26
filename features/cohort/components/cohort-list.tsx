import Link from "next/link";
import { Users } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCohorts } from "../cohort-queries";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border border-border/60",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
  completed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
};

export async function CohortList() {
  const cohorts = await listCohorts();
  if (cohorts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No cohorts yet — create the first intake above.
      </p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cohort Name</TableHead>
          <TableHead>Starts</TableHead>
          <TableHead>Ends</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Scholars</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cohorts.map((c) => (
          <TableRow key={c.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {c.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <Link
                    href={`/cohorts/${c.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors text-sm"
                  >
                    {c.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">Academic Cohort</p>
                </div>
              </div>
            </TableCell>
            <TableCell>{formatDate(c.startsAt)}</TableCell>
            <TableCell>{formatDate(c.endsAt)}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[c.status]}`}
              >
                {c.status}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4 text-primary" />
                <span className="font-medium text-foreground">{c.scholarCount}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CohortListSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="mb-3 h-10 animate-pulse rounded-lg bg-muted/60"
        />
      ))}
    </div>
  );
}

function formatDate(d: Date | null) {
  return d ? d.toLocaleDateString("en-GB", { timeZone: "UTC" }) : "—";
}
