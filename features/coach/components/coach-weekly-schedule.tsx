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
  Info,
  User,
  Video,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocalTime } from "@/components/local-time";
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

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 07:00 to 19:00

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

  // Helper to check if a given day and hour falls within working hours
  const isWorkingHour = (date: Date, hour: number) => {
    if (!hasConfiguredWorkingHours || !workingHours) return false;
    const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ...
    const dateYmd = format(date, "yyyy-MM-dd");

    // Check date overrides / vacation ranges
    const isRangeBlocked = (workingHours.blockedRanges || []).some(
      (r) => dateYmd >= r.startDate && dateYmd <= r.endDate,
    );
    if (isRangeBlocked) return false;

    const override = (workingHours.overrides || []).find((o) => o.date === dateYmd);
    if (override?.isBlocked) return false;

    let startHour = parseInt(workingHours.start.split(":")[0], 10);
    let endHour = parseInt(workingHours.end.split(":")[0], 10);
    let isWorkingDay = workingHours.days.includes(dayOfWeek);

    if (override?.start && override?.end) {
      startHour = parseInt(override.start.split(":")[0], 10);
      endHour = parseInt(override.end.split(":")[0], 10);
      isWorkingDay = true;
    }

    if (!isWorkingDay) return false;
    return hour >= startHour && hour < endHour;
  };

  const formattedWeekLabel = useMemo(() => {
    const startStr = format(currentWeekStart, "dd MMM");
    const endStr = format(addDays(currentWeekStart, daysCount - 1), "dd MMM yyyy");
    return `${startStr} – ${endStr}`;
  }, [currentWeekStart, daysCount]);

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
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${daysCount === 5
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              5 Days
            </button>
            <button
              type="button"
              onClick={() => setDaysCount(7)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${daysCount === 7
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

      {/* 5 / 7 Day Weekly Grid View */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Column Headers (Days) */}
            <div className="grid grid-cols-[60px_repeat(var(--days-count),minmax(0,1fr))] border-b bg-muted/30" style={{ "--days-count": daysCount } as any}>
              <div className="p-3 text-center text-xs font-semibold text-muted-foreground border-r">
                Time
              </div>
              {daysToRender.map((day) => {
                const isCurrent = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-3 text-center border-r last:border-r-0 min-w-0 ${isCurrent ? "bg-primary/5" : ""
                      }`}
                  >
                    <div className="text-xs font-medium text-muted-foreground">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={`text-sm font-bold mt-0.5 inline-flex items-center justify-center rounded-full size-7 ${isCurrent
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

            {/* Grid Hours Rows */}
            <div className="divide-y">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-[60px_repeat(var(--days-count),minmax(0,1fr))] min-h-[64px]"
                  style={{ "--days-count": daysCount } as any}
                >
                  {/* Time Gutter Column */}
                  <div className="p-2 text-right text-[11px] font-medium text-muted-foreground border-r bg-muted/20 shrink-0">
                    {String(hour).padStart(2, "0")}:00
                  </div>

                  {/* Day Cells for this Hour */}
                  {daysToRender.map((day) => {
                    const isWorking = isWorkingHour(day, hour);

                    // Filter availability slots in this hour
                    const hourSlots = slots.filter((s) => {
                      const st = new Date(s.startsAt);
                      return isSameDay(st, day) && st.getHours() === hour;
                    });

                    // Filter programme sessions in this hour
                    const hourSessions = sessions.filter((s) => {
                      const st = new Date(s.startsAt);
                      return isSameDay(st, day) && st.getHours() === hour;
                    });

                    // Filter iCal busy slots in this hour
                    const hourIcal = icalBusyBlocks.filter((b) => {
                      const st = new Date(b.start);
                      return isSameDay(st, day) && st.getHours() === hour;
                    });

                    const hasContent =
                      hourSlots.length > 0 ||
                      hourSessions.length > 0 ||
                      hourIcal.length > 0;

                    return (
                      <div
                        key={day.toISOString()}
                        className={`p-1 border-r last:border-r-0 transition-colors flex flex-col gap-1 min-w-0 ${!isWorking && !hasContent
                          ? "bg-muted/25"
                          : isWorking && !hasContent
                            ? "bg-background/80 hover:bg-muted/10"
                            : "bg-background"
                          }`}
                      >
                        {/* Render Open & Booked Slots */}
                        {hourSlots.map((s) => (
                          <div
                            key={s.slotId}
                            className={`rounded-lg p-2 text-xs transition-all border break-words whitespace-normal min-w-0 ${s.status === "booked"
                              ? "bg-blue-100 text-blue-900 dark:text-blue-200 border-blue-200"
                              : "bg-emerald-200 text-emerald-900 dark:text-emerald-200 border-emerald-200"
                              }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1 font-semibold text-[11px]">
                              <span>
                                {format(new Date(s.startsAt), "HH:mm")} – {format(new Date(s.endsAt), "HH:mm")}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1 py-0 h-4 border-none capitalize ${s.status === "booked"
                                  ? "bg-blue-200 text-blue-800 dark:text-blue-500"
                                  : "bg-emerald-100 text-emerald-800 dark:text-emerald-300"
                                  }`}
                              >
                                {s.status === "open" ? "Available" : "Booked"}
                              </Badge>
                            </div>
                            {s.scholarName && (
                              <div className="mt-1 flex items-start gap-1 text-[11px] font-medium break-words whitespace-normal">
                                <User className="size-3 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <span className="break-words">{s.scholarName}</span>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Render Programme Sessions */}
                        {hourSessions.map((sess) => (
                          <div
                            key={sess.id}
                            className="rounded-lg p-2 text-xs bg-violet-500/10 text-violet-900 dark:text-violet-200 border border-violet-500/25 break-words whitespace-normal min-w-0"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1 font-semibold text-[11px]">
                              <span className="break-words">{sess.title}</span>
                              {sess.meetLink && (
                                <a
                                  href={sess.meetLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-0.5 shrink-0 text-[10px]"
                                >
                                  <Video className="size-3" />
                                  Meet
                                </a>
                              )}
                            </div>
                            <div className="mt-0.5 text-[10px] text-violet-700 dark:text-violet-300">
                              {format(new Date(sess.startsAt), "HH:mm")} – {format(new Date(sess.endsAt), "HH:mm")}
                            </div>
                          </div>
                        ))}

                        {/* Render iCal Busy Blocks */}
                        {hourIcal.map((b, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg p-1.5 text-[11px] bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/25 break-words whitespace-normal min-w-0"
                          >
                            <div className="font-medium break-words">
                              Busy (External Calendar)
                            </div>
                            <div className="text-[10px] text-amber-700 dark:text-amber-400">
                              {format(new Date(b.start), "HH:mm")} – {format(new Date(b.end), "HH:mm")}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
