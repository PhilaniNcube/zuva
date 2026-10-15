"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Download, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LocalTime } from "@/components/local-time";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AttendanceRosterEntry } from "../attendance-types";
import { markAttendance } from "../session-actions";

export function SessionAttendanceRegister({
  sessionId,
  roster,
}: {
  sessionId: string;
  roster: AttendanceRosterEntry[];
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingScholar, setPendingScholar] = useState<string | null>(null);

  const attendedCount = roster.filter((entry) => entry.joinedAt).length;

  function toggle(entry: AttendanceRosterEntry) {
    const present = !entry.joinedAt;
    setPendingScholar(entry.scholarId);
    startTransition(async () => {
      const result = await markAttendance({
        sessionId,
        scholarId: entry.scholarId,
        present,
      });
      if (result.ok) {
        toast.success(present ? "Marked present" : "Marked absent");
      } else {
        toast.error(result.error);
      }
      setPendingScholar(null);
    });
  }

  function exportCsv() {
    const header = ["Name", "Email", "Status", "Joined At", "Source"];
    const rows = roster.map((entry) => [
      entry.name,
      entry.email,
      entry.joinedAt ? "Attended" : "Absent",
      entry.joinedAt ? entry.joinedAt.toISOString() : "",
      entry.source ?? "",
    ]);
    const csv = [header, ...rows]
      .map((cols) =>
        cols.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(","),
      )
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "attendance.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Attendance register
          </h2>
          <p className="text-xs text-muted-foreground">
            {attendedCount} of {roster.length} attended. Manual edits are
            recorded separately from join clicks.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCsv}
          disabled={roster.length === 0}
          className="gap-2 text-xs"
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {roster.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No expected attendees for this session yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scholar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Mark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((entry) => {
                const busy = isPending && pendingScholar === entry.scholarId;
                const sourceLabel =
                  entry.source === "manual_admin"
                    ? " · manual"
                    : entry.source === "join_click"
                      ? " · join click"
                      : "";
                return (
                  <TableRow key={entry.scholarId}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">
                        {entry.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.email}
                      </p>
                    </TableCell>
                    <TableCell>
                      {entry.joinedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          Attended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          <XCircle className="size-3" />
                          Absent
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.joinedAt ? (
                        <>
                          <LocalTime value={entry.joinedAt} />
                          {sourceLabel}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        disabled={busy}
                        onClick={() => toggle(entry)}
                      >
                        {entry.joinedAt ? "Mark absent" : "Mark present"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
