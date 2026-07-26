"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Activity,
  CalendarDays,
  Clock,
  Search,
  UserCheck,
  Video,
} from "lucide-react";

import { LocalTime } from "@/components/local-time";
import { DataTable } from "@/components/ui/data-table";
import type { listAdminSessions } from "../session-queries";
import { JoinCallButton } from "./join-call-button";
import { CancelSessionButton } from "./slot-buttons";

export type AdminSessionItem = Awaited<
  ReturnType<typeof listAdminSessions>
>[number];

const columns: ColumnDef<AdminSessionItem>[] = [
  {
    accessorKey: "title",
    header: () => (
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-foreground/80">
        <CalendarDays className="size-4 text-primary" />
        <span>Session</span>
      </div>
    ),
    cell: ({ row }) => {
      const s = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg text-primary flex items-center justify-center shrink-0">
            <CalendarDays className="size-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-foreground text-sm">
              {s.title}
            </span>
            <span className="text-xs text-muted-foreground capitalize mt-0.5">
              {s.type.replace("_", " ")}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "coachName",
    header: () => (
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-foreground/80">
        <UserCheck className="size-4 text-primary" />
        <span>Coach & Cohort</span>
      </div>
    ),
    cell: ({ row }) => {
      const s = row.original;
      return (
        <div className="flex flex-col leading-tight">
          <span className="font-medium text-foreground text-sm">
            {s.coachName ?? "Unassigned"}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">
            {s.cohortName}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "startsAt",
    header: () => (
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-foreground/80">
        <Clock className="size-4 text-primary" />
        <span>When</span>
      </div>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        <LocalTime value={row.original.startsAt} />
      </span>
    ),
  },
  {
    id: "meetLink",
    header: () => (
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-foreground/80">
        <Video className="size-4 text-primary" />
        <span>Meet Link</span>
      </div>
    ),
    cell: ({ row }) => (
      <JoinCallButton
        sessionId={row.original.id}
        meetLinkAvailable={!!row.original.meetLink}
      />
    ),
  },
  {
    accessorKey: "status",
    header: () => (
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-foreground/80">
        <Activity className="size-4 text-primary" />
        <span>Status</span>
      </div>
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${status === "scheduled"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-muted text-muted-foreground border border-border/60"
            }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right text-xs sm:text-sm font-semibold uppercase tracking-wider text-foreground/80">
        Action
      </div>
    ),
    cell: ({ row }) => {
      const s = row.original;
      return (
        <div className="text-right">
          {s.status === "scheduled" ? (
            <CancelSessionButton sessionId={s.id} />
          ) : null}
        </div>
      );
    },
  },
];

export function AdminSessionTable({
  sessions,
}: {
  sessions: AdminSessionItem[];
}) {
  const [search, setSearch] = useState("");

  const filteredSessions = sessions.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.type.toLowerCase().includes(q) ||
      (s.coachName && s.coachName.toLowerCase().includes(q)) ||
      s.cohortName.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search & Overview Card */}
      <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-md p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
          <h3 className="font-heading font-semibold text-base tracking-tight text-foreground">
            Programme Schedule
          </h3>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
            {filteredSessions.length} {filteredSessions.length === 1 ? "session" : "sessions"}
          </span>
        </div>

        <div className="relative w-full sm:max-w-xs md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, coach, cohort..."
            className="w-full h-9 rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-2xs transition-colors"
          />
        </div>
      </div>

      {/* Table Container Card */}
      <DataTable columns={columns} data={filteredSessions} />
    </div>
  );
}
