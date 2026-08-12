"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Video,
  AlertTriangle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminCoachSyncButton } from "./admin-coach-sync-button";
import type { WorkingHoursInput } from "../working-hours";

export interface ScheduleSlot {
  slotId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  bookingId?: string | null;
  scholarName?: string | null;
  sessionId?: string | null;
  meetLink?: string | null;
}

export interface ScheduleSession {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  meetLink?: string | null;
  status: string;
}

export interface IcalBusySlot {
  start: Date;
  end: Date;
  summary?: string;
}

interface CoachWeeklyScheduleProps {
  coachUserId: string;
  coachName: string;
  workingHours: WorkingHoursInput | null;
  slots: ScheduleSlot[];
  sessions: ScheduleSession[];
  icalBusyBlocks?: IcalBusySlot[];
  icalUrl?: string | null;
  lastSyncedAt?: Date | null;
}

interface CalendarEventItem {
  id: string;
  type: "open_slot" | "booked_slot" | "session" | "ical";
  startsAt: Date;
  endsAt: Date;
  title: string;
  scholarName?: string | null;
  meetLink?: string | null;
  status?: string;
}

interface PositionedEventItem extends CalendarEventItem {
  topPx: number;
  heightPx: number;
  colIndex: number;
  totalCols: number;
}

const GRID_START_HOUR = 7; // 07:00
const GRID_END_HOUR = 19;  // 19:00
const HOUR_HEIGHT_PX = 64; // 64px per hour -> 16px per 15 mins

const HOURS = Array.from(
  { length: GRID_END_HOUR - GRID_START_HOUR },
  (_, i) => i + GRID_START_HOUR,
);

export function CoachWeeklySchedule({
  coachUserId,
  coachName,
  workingHours,
  slots,
  sessions,
  icalBusyBlocks = [],
  icalUrl,
  lastSyncedAt,
}: CoachWeeklyScheduleProps) {
  // Navigation state: current week start (Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [daysCount, setDaysCount] = useState<5 | 7>(5);

  const daysToRender = useMemo(() => {
    return Array.from({ length: daysCount }, (_, i) =>
      addDays(currentWeekStart, i),
    );
  }, [currentWeekStart, daysCount]);

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const hasConfiguredWorkingHours =
    workingHours &&
    Array.isArray(workingHours.days) &&
    workingHours.days.length > 0;

  // Working hours range for a date
  const getWorkingHoursForDate = (date: Date) => {
    if (!hasConfiguredWorkingHours || !workingHours) return null;
    const dayOfWeek = date.getDay();
    const dateYmd = format(date, "yyyy-MM-dd");

    const isRangeBlocked = (workingHours.blockedRanges || []).some(
      (r) => dateYmd >= r.startDate && dateYmd <= r.endDate,
    );
    if (isRangeBlocked) return null;

    const override = (workingHours.overrides || []).find((o) => o.date === dateYmd);
    if (override?.isBlocked) return null;

    let startStr = workingHours.start;
    let endStr = workingHours.end;
    let isWorkingDay = workingHours.days.includes(dayOfWeek);

    if (override?.start && override?.end) {
      startStr = override.start;
      endStr = override.end;
      isWorkingDay = true;
    }

    if (!isWorkingDay) return null;

    const [sHour, sMin] = startStr.split(":").map(Number);
    const [eHour, eMin] = endStr.split(":").map(Number);
    return { startMin: sHour * 60 + sMin, endMin: eHour * 60 + eMin };
  };

  const formattedWeekLabel = useMemo(() => {
    const startStr = format(currentWeekStart, "dd MMM");
    const endStr = format(addDays(currentWeekStart, daysCount - 1), "dd MMM yyyy");
    return `${startStr} – ${endStr}`;
  }, [currentWeekStart, daysCount]);

  // Position & layout events for a given day column
  const getPositionedEventsForDay = (day: Date): PositionedEventItem[] => {
    const rawEvents: CalendarEventItem[] = [];

    // Slots
    for (const s of slots) {
      const st = new Date(s.startsAt);
      if (isSameDay(st, day)) {
        rawEvents.push({
          id: `slot-${s.slotId}`,
          type: s.status === "booked" ? "booked_slot" : "open_slot",
          startsAt: st,
          endsAt: new Date(s.endsAt),
          title: s.status === "booked" ? "1:1 Coaching Session" : "Available Slot",
          scholarName: s.scholarName,
          meetLink: s.meetLink,
          status: s.status,
        });
      }
    }

    // Programme Sessions
    for (const sess of sessions) {
      const st = new Date(sess.startsAt);
      if (isSameDay(st, day)) {
        rawEvents.push({
          id: `session-${sess.id}`,
          type: "session",
          startsAt: st,
          endsAt: new Date(sess.endsAt),
          title: sess.title,
          meetLink: sess.meetLink,
          status: sess.status,
        });
      }
    }

    // iCal Busy Blocks
    for (let i = 0; i < icalBusyBlocks.length; i++) {
      const b = icalBusyBlocks[i];
      const st = new Date(b.start);
      if (isSameDay(st, day)) {
        rawEvents.push({
          id: `ical-${i}-${st.getTime()}`,
          type: "ical",
          startsAt: st,
          endsAt: new Date(b.end),
          title: "Busy (External Calendar)",
        });
      }
    }

    if (rawEvents.length === 0) return [];

    // Sort by start time, then duration
    rawEvents.sort((a, b) => {
      const diff = a.startsAt.getTime() - b.startsAt.getTime();
      if (diff !== 0) return diff;
      return (
        b.endsAt.getTime() -
        b.startsAt.getTime() -
        (a.endsAt.getTime() - a.startsAt.getTime())
      );
    });

    const gridStartMin = GRID_START_HOUR * 60;
    const gridEndMin = GRID_END_HOUR * 60;

    // Calculate initial top and height
    const baseItems = rawEvents.map((ev) => {
      const startMin = ev.startsAt.getHours() * 60 + ev.startsAt.getMinutes();
      const endMin = ev.endsAt.getHours() * 60 + ev.endsAt.getMinutes();

      const clampedStart = Math.max(gridStartMin, Math.min(gridEndMin, startMin));
      const clampedEnd = Math.max(gridStartMin, Math.min(gridEndMin, endMin));

      const topPx = ((clampedStart - gridStartMin) / 60) * HOUR_HEIGHT_PX;
      const durationMin = Math.max(15, clampedEnd - clampedStart);
      const heightPx = (durationMin / 60) * HOUR_HEIGHT_PX;

      return {
        ...ev,
        topPx,
        heightPx,
        startMin,
        endMin,
        colIndex: 0,
        totalCols: 1,
      };
    });

    // Simple cluster tiling algorithm for overlapping events
    const clusters: typeof baseItems[] = [];
    let currentCluster: typeof baseItems = [];
    let clusterMaxEnd = 0;

    for (const item of baseItems) {
      if (currentCluster.length === 0) {
        currentCluster.push(item);
        clusterMaxEnd = item.endMin;
      } else if (item.startMin < clusterMaxEnd) {
        currentCluster.push(item);
        clusterMaxEnd = Math.max(clusterMaxEnd, item.endMin);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterMaxEnd = item.endMin;
      }
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    const result: PositionedEventItem[] = [];
    for (const cluster of clusters) {
      const totalCols = cluster.length;
      cluster.forEach((item, colIndex) => {
        result.push({
          ...item,
          colIndex,
          totalCols,
        });
      });
    }

    return result;
  };

  const totalGridHeightPx = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT_PX;

  return (
    <div className="flex flex-col gap-4">
      {/* Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handlePrevWeek}
              title="Previous Week"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs font-medium"
              onClick={handleToday}
            >
              Today
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleNextWeek}
              title="Next Week"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground ml-1">
            {formattedWeekLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 5-day / 7-day Toggle */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setDaysCount(5)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                daysCount === 5
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              5 Days
            </button>
            <button
              type="button"
              onClick={() => setDaysCount(7)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                daysCount === 7
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              7 Days
            </button>
          </div>

          <AdminCoachSyncButton coachUserId={coachUserId} disabled={!icalUrl} />
        </div>
      </div>

      {/* Unconfigured Working Hours Banner */}
      {!hasConfiguredWorkingHours && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">
                Accepted Booking Hours Not Configured
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {coachName} has not yet specified weekly working hours for 1:1 coaching bookings. Click "Sync Calendar Now" or update coach settings to generate open slots.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legend Bar */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap px-1">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
          <span>Open Slot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-blue-500/20 border border-blue-500/40" />
          <span>Booked 1:1</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-violet-500/20 border border-violet-500/40" />
          <span>Programme Session</span>
        </div>
        {icalUrl && (
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
            <span>Busy (External Calendar)</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-muted border border-border" />
          <span>Outside Working Hours</span>
        </div>
      </div>

      {/* Google Calendar Style Grid View */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[750px]">
            {/* Column Headers (Days) */}
            <div
              className="grid grid-cols-[60px_repeat(var(--days-count),minmax(0,1fr))] border-b bg-muted/30"
              style={{ "--days-count": daysCount } as any}
            >
              <div className="p-3 text-center text-xs font-semibold text-muted-foreground border-r">
                Time
              </div>
              {daysToRender.map((day) => {
                const isCurrent = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-3 text-center border-r last:border-r-0 min-w-0 ${
                      isCurrent ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="text-xs font-medium text-muted-foreground">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={`text-sm font-bold mt-0.5 inline-flex items-center justify-center rounded-full size-7 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grid Body: Time Gutter + Days Columns */}
            <div
              className="grid grid-cols-[60px_repeat(var(--days-count),minmax(0,1fr))] relative"
              style={{
                "--days-count": daysCount,
                height: `${totalGridHeightPx}px`,
              } as any}
            >
              {/* Left Time Gutter */}
              <div className="border-r bg-muted/20 relative select-none">
                {HOURS.map((hour, idx) => (
                  <div
                    key={hour}
                    className="absolute w-full pr-2 text-right text-[11px] font-medium text-muted-foreground -mt-2"
                    style={{ top: `${idx * HOUR_HEIGHT_PX}px` }}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {daysToRender.map((day) => {
                const wh = getWorkingHoursForDate(day);
                const events = getPositionedEventsForDay(day);

                // Calculate working hours top and height
                let whTopPx: number | null = null;
                let whHeightPx: number | null = null;
                if (wh) {
                  const gStart = GRID_START_HOUR * 60;
                  const gEnd = GRID_END_HOUR * 60;
                  const cStart = Math.max(gStart, Math.min(gEnd, wh.startMin));
                  const cEnd = Math.max(gStart, Math.min(gEnd, wh.endMin));
                  whTopPx = ((cStart - gStart) / 60) * HOUR_HEIGHT_PX;
                  whHeightPx = ((cEnd - cStart) / 60) * HOUR_HEIGHT_PX;
                }

                return (
                  <div
                    key={day.toISOString()}
                    className="border-r last:border-r-0 relative min-w-0 bg-muted/25"
                    style={{ height: `${totalGridHeightPx}px` }}
                  >
                    {/* Background Working Hours Highlight */}
                    {whTopPx !== null && whHeightPx !== null && (
                      <div
                        className="absolute inset-x-0 bg-background"
                        style={{
                          top: `${whTopPx}px`,
                          height: `${whHeightPx}px`,
                        }}
                      />
                    )}

                    {/* Horizontal 15-Minute Guideline Grid Lines */}
                    {HOURS.map((_, idx) => (
                      <div
                        key={idx}
                        className="absolute inset-x-0 border-t border-border/40 pointer-events-none"
                        style={{ top: `${idx * HOUR_HEIGHT_PX}px` }}
                      >
                        {/* 30-min guideline line */}
                        <div
                          className="absolute inset-x-0 border-t border-dashed border-border/20 pointer-events-none"
                          style={{ top: `${HOUR_HEIGHT_PX / 2}px` }}
                        />
                      </div>
                    ))}

                    {/* Positioned Event Blocks */}
                    {events.map((ev) => {
                      const leftPercent = (ev.colIndex / ev.totalCols) * 100;
                      const widthPercent = 100 / ev.totalCols;

                      let bgClass = "";
                      if (ev.type === "open_slot") {
                        bgClass =
                          "bg-emerald-500/15 text-emerald-950 dark:text-emerald-100 border-emerald-500/30 hover:bg-emerald-500/20";
                      } else if (ev.type === "booked_slot") {
                        bgClass =
                          "bg-blue-500/15 text-blue-950 dark:text-blue-100 border-blue-500/30 hover:bg-blue-500/20";
                      } else if (ev.type === "session") {
                        bgClass =
                          "bg-violet-500/15 text-violet-950 dark:text-violet-100 border-violet-500/30 hover:bg-violet-500/20";
                      } else {
                        bgClass =
                          "bg-amber-500/15 text-amber-950 dark:text-amber-100 border-amber-500/30 hover:bg-amber-500/20";
                      }

                      return (
                        <div
                          key={ev.id}
                          className={`absolute rounded-lg border p-1.5 text-xs transition-all overflow-hidden flex flex-col justify-between shadow-2xs z-10 ${bgClass}`}
                          style={{
                            top: `${ev.topPx + 1}px`,
                            height: `${Math.max(20, ev.heightPx - 2)}px`,
                            left: `calc(${leftPercent}% + 2px)`,
                            width: `calc(${widthPercent}% - 4px)`,
                          }}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-semibold leading-tight">
                              <span className="truncate">
                                {format(ev.startsAt, "HH:mm")} – {format(ev.endsAt, "HH:mm")}
                              </span>
                              {ev.type === "open_slot" && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-3.5 border-none bg-emerald-500/20 text-emerald-800 dark:text-emerald-200"
                                >
                                  Available
                                </Badge>
                              )}
                              {ev.type === "booked_slot" && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-3.5 border-none bg-blue-500/20 text-blue-800 dark:text-blue-200"
                                >
                                  Booked
                                </Badge>
                              )}
                            </div>

                            {/* Event details */}
                            {ev.type === "session" && (
                              <div className="mt-0.5 font-medium text-[11px] break-words line-clamp-2 leading-tight">
                                {ev.title}
                              </div>
                            )}

                            {ev.type === "booked_slot" && ev.scholarName && (
                              <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium truncate">
                                <User className="size-3 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="truncate">{ev.scholarName}</span>
                              </div>
                            )}

                            {ev.type === "ical" && (
                              <div className="mt-0.5 font-medium text-[10px] truncate text-amber-800 dark:text-amber-300">
                                Busy (External)
                              </div>
                            )}
                          </div>

                          {ev.meetLink && ev.heightPx > 40 && (
                            <div className="mt-1 self-start">
                              <a
                                href={ev.meetLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                              >
                                <Video className="size-3" />
                                Meet
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
