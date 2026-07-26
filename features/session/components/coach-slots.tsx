import { Clock } from "lucide-react";

import { LocalTime } from "@/components/local-time";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCoachSlots } from "../session-queries";
import { JoinCallButton } from "./join-call-button";
import { CancelSlotButton } from "./slot-buttons";

export async function CoachSlots({ coachId }: { coachId: string }) {
  const slots = await listCoachSlots(coachId);
  const visible = slots.filter((s) => s.status !== "cancelled");

  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No slots yet — publish your first availability above.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time Slot</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Scholar</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visible.map((s) => (
          <TableRow key={s.slotId}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Clock className="size-5" />
                </div>
                <span className="font-medium text-foreground text-sm">
                  <LocalTime value={s.startsAt} /> –{" "}
                  <LocalTime value={s.endsAt} format="time" />
                </span>
              </div>
            </TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  s.status === "booked"
                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {s.status}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">{s.scholarName ?? "—"}</TableCell>
            <TableCell className="text-right">
              {s.status === "open" ? (
                <CancelSlotButton slotId={s.slotId} />
              ) : s.sessionId ? (
                <JoinCallButton
                  sessionId={s.sessionId}
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

export function CoachSlotsSkeleton() {
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
