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
import { listCoachSessions } from "../session-queries";
import { JoinCallButton } from "./join-call-button";

export async function CoachSessions({ coachId }: { coachId: string }) {
  const sessions = await listCoachSessions(coachId);

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No masterclasses or orientations assigned to you yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session</TableHead>
          <TableHead>Cohort</TableHead>
          <TableHead>When</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
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
                <div>
                  <span className="font-medium text-foreground text-sm">{s.title}</span>
                  <p className="text-xs text-muted-foreground capitalize">{s.typeName}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>{s.cohortName}</TableCell>
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
            <TableCell className="text-right">
              {s.status === "scheduled" ? (
                <JoinCallButton
                  sessionId={s.id}
                  meetLinkAvailable={!!s.meetLink}
                />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CoachSessionsSkeleton() {
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
