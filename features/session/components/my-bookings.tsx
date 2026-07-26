import Link from "next/link";
import { UserCheck } from "lucide-react";

import { LocalTime } from "@/components/local-time";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listScholarBookings } from "../session-queries";
import { CancelBookingButton } from "./slot-buttons";

export async function MyBookings({ scholarId }: { scholarId: string }) {
  const bookings = await listScholarBookings(scholarId);

  if (bookings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No 1:1 bookings yet — pick a slot below.
      </p>
    );
  }

  const now = new Date();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session</TableHead>
          <TableHead>Coach</TableHead>
          <TableHead>When</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((b) => (
          <TableRow key={b.bookingId}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <UserCheck className="size-5" />
                </div>
                <Link
                  href={`/sessions/${b.sessionId}`}
                  className="font-medium text-foreground hover:text-primary transition-colors text-sm"
                >
                  {b.title}
                </Link>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{b.coachName ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">
              <LocalTime value={b.startsAt} />
            </TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  b.bookingStatus === "confirmed"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-muted text-muted-foreground border border-border/60"
                }`}
              >
                {b.bookingStatus}
              </span>
            </TableCell>
            <TableCell className="text-right">
              {b.bookingStatus === "confirmed" && b.startsAt > now ? (
                <CancelBookingButton bookingId={b.bookingId} />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function MyBookingsSkeleton() {
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
