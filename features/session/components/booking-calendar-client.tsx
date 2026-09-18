"use client";

import { useMemo, useState, useTransition } from "react";
import { addDays, format, isToday, startOfWeek } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  User,
  Video,
} from "lucide-react";

import { LocalTime } from "@/components/local-time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPECIALTIES, type Specialty } from "@/features/coach/specialties";
import {
  resolveWorkingWindow,
  type WorkingHoursInput,
} from "@/features/coach/working-hours";
import { bookSlot } from "../session-actions";

export interface OpenSlotItem {
  slotId: string;
  startsAt: Date;
  endsAt: Date;
  coachId: string;
  coachName: string;
  specialty: Specialty | null;
}

export interface CoachingTopic {
  id: string;
  name: string;
}

export interface CoachItem {
  id: string;
  name: string;
  email: string;
  specialty: Specialty | null;
}

export interface ScholarBookingItem {
  bookingId: string;
  bookingStatus: string;
  sessionId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  meetLink: string | null;
  coachName: string | null;
}

export interface ScholarCohortSessionItem {
  id: string;
  kind: string;
  format: string;
  typeName: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  meetLink: string | null;
  coachName: string | null;
  cohortName: string;
}

interface BookingCalendarClientProps {
  slots: OpenSlotItem[];
  topics: CoachingTopic[];
  coaches: CoachItem[];
  myBookings: ScholarBookingItem[];
  cohortSessions: ScholarCohortSessionItem[];
  workingHoursByCoach: Record<string, WorkingHoursInput | null>;
}

type CalendarEventType = "open_slot" | "my_booking" | "programme_session";

interface CalendarEventItem {
  id: string;
  type: CalendarEventType;
  startsAt: Date;
  endsAt: Date;
  title: string;
  coachName?: string | null;
  specialty?: Specialty | null;
  meetLink?: string | null;
  slotId?: string;
}

interface MeasuredEventItem extends CalendarEventItem {
  topPx: number;
  heightPx: number;
  startMin: number;
  endMin: number;
  colIndex: number;
  totalCols: number;
}

type PositionedEventItem = MeasuredEventItem;

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 19;
const HOUR_HEIGHT_PX = 64;

const HOURS = Array.from(
  { length: GRID_END_HOUR - GRID_START_HOUR },
  (_, i) => i + GRID_START_HOUR,
);

function getWorkingHoursForDate(date: Date, wh: WorkingHoursInput | null) {
  const window = resolveWorkingWindow(wh, date);
  if (!window) return null;

  const [sHour, sMin] = window.start.split(":").map(Number);
  const [eHour, eMin] = window.end.split(":").map(Number);
  return { startMin: sHour * 60 + sMin, endMin: eHour * 60 + eMin };
}

function positionEventsForDay(
  rawEvents: CalendarEventItem[],
): PositionedEventItem[] {
  if (rawEvents.length === 0) return [];

  const sorted = [...rawEvents].sort((a, b) => {
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

  const baseItems: MeasuredEventItem[] = sorted.map((ev) => {
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

  const clusters: MeasuredEventItem[][] = [];
  let currentCluster: MeasuredEventItem[] = [];
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
      result.push({ ...item, colIndex, totalCols });
    });
  }

  return result;
}

export function BookingCalendarClient({
  slots,
  topics,
  coaches,
  myBookings,
  cohortSessions,
  workingHoursByCoach,
}: BookingCalendarClientProps) {
  const [selectedCoachId, setSelectedCoachId] = useState(coaches[0]?.id ?? "");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [daysCount, setDaysCount] = useState<5 | 7>(5);
  const [bookedSlotIds, setBookedSlotIds] = useState<Set<string>>(new Set());
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCoach = coaches.find((c) => c.id === selectedCoachId) ?? null;
  const selectedWorkingHours = selectedCoachId
    ? (workingHoursByCoach[selectedCoachId] ?? null)
    : null;

  const daysToRender = useMemo(
    () => Array.from({ length: daysCount }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart, daysCount],
  );

  const coachSelectItems = useMemo(() => {
    return coaches.map((c) => {
      const count = slots.filter(
        (s) => s.coachId === c.id && !bookedSlotIds.has(s.slotId),
      ).length;
      const specialtyText = c.specialty
        ? SPECIALTIES[c.specialty] || c.specialty
        : null;
      return {
        value: c.id,
        label: c.name,
        displayLabel: `${c.name}${specialtyText ? ` • ${specialtyText}` : ""} (${count} ${count === 1 ? "slot" : "slots"})`,
      };
    });
  }, [coaches, slots, bookedSlotIds]);

  const coachOpenSlotCount = useMemo(
    () => slots.filter((s) => s.coachId === selectedCoachId).length,
    [slots, selectedCoachId],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    const push = (dayKey: string, ev: CalendarEventItem) => {
      const list = map.get(dayKey);
      if (list) list.push(ev);
      else map.set(dayKey, [ev]);
    };

    for (const s of slots) {
      if (s.coachId !== selectedCoachId || bookedSlotIds.has(s.slotId)) continue;
      push(new Date(s.startsAt).toDateString(), {
        id: `slot-${s.slotId}`,
        type: "open_slot",
        startsAt: new Date(s.startsAt),
        endsAt: new Date(s.endsAt),
        title: "Available 1:1 slot",
        coachName: s.coachName,
        specialty: s.specialty,
        slotId: s.slotId,
      });
    }

    for (const b of myBookings) {
      if (b.bookingStatus !== "confirmed") continue;
      push(new Date(b.startsAt).toDateString(), {
        id: `booking-${b.bookingId}`,
        type: "my_booking",
        startsAt: new Date(b.startsAt),
        endsAt: new Date(b.endsAt),
        title: b.title,
        coachName: b.coachName,
        meetLink: b.meetLink,
      });
    }

    for (const s of cohortSessions) {
      if (s.status !== "scheduled") continue;
      push(new Date(s.startsAt).toDateString(), {
        id: `session-${s.id}`,
        type: "programme_session",
        startsAt: new Date(s.startsAt),
        endsAt: new Date(s.endsAt),
        title: s.title,
        coachName: s.coachName,
        meetLink: s.meetLink,
      });
    }

    return map;
  }, [slots, selectedCoachId, bookedSlotIds, myBookings, cohortSessions]);

  const formattedWeekLabel = useMemo(() => {
    const startStr = format(currentWeekStart, "dd MMM");
    const endStr = format(addDays(currentWeekStart, daysCount - 1), "dd MMM yyyy");
    return `${startStr} – ${endStr}`;
  }, [currentWeekStart, daysCount]);

  const handleBookSlot = (slotId: string) => {
    if (!topicId) {
      setErrorMessage("Please select a coaching topic first.");
      return;
    }

    setPendingSlotId(slotId);
    setErrorMessage(null);

    startTransition(async () => {
      const result = await bookSlot(slotId, topicId);
      if (!result.ok) {
        setErrorMessage(result.error);
        setPendingSlotId(null);
        return;
      }
      setBookedSlotIds((prev) => new Set(prev).add(slotId));
      setPendingSlotId(null);
    });
  };

  if (coaches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-10 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
          <CalendarIcon className="h-5 w-5 text-zinc-500" />
        </div>
        <h4 className="text-sm font-medium text-zinc-900">No coaches yet</h4>
        <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500">
          Coaches will appear here once the programme team adds them.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Coach & Topic Selection */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex w-full flex-col gap-1.5 sm:max-w-xs">
            <label className="text-xs font-semibold text-zinc-700">Coach</label>
            <Select
              value={selectedCoachId}
              onValueChange={(val) => {
                if (val) setSelectedCoachId(val);
              }}
              items={coachSelectItems}
            >
              <SelectTrigger className="h-10 w-full border-zinc-200 bg-white text-xs font-medium sm:text-sm">
                <SelectValue placeholder="Select a coach">
                  {selectedCoach?.name ?? "Select a coach"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start" className="max-h-72">
                {coachSelectItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.displayLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 sm:max-w-md">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Select Coaching Topic:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopicId(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    topicId === t.id
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {errorMessage}
          </div>
        )}
      </div>

      {coachOpenSlotCount === 0 && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-start gap-3">
            <CalendarIcon className="mt-0.5 size-5 shrink-0 text-zinc-400" />
            <div>
              <h4 className="text-sm font-semibold text-zinc-900">
                {selectedCoach?.name ?? "This coach"} has no open 1:1 slots right
                now
              </h4>
              <p className="mt-0.5 text-xs text-zinc-500">
                Coaches publish availability regularly — pick another coach or
                check back soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setCurrentWeekStart((prev) => addDays(prev, -7))}
              title="Previous Week"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs font-medium"
              onClick={() =>
                setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
              }
            >
              Today
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setCurrentWeekStart((prev) => addDays(prev, 7))}
              title="Next Week"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <span
            className="ml-1 text-sm font-semibold tracking-tight text-foreground"
            suppressHydrationWarning
          >
            {formattedWeekLabel}
          </span>
        </div>

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
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 px-1 text-xs font-medium text-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-emerald-600 bg-emerald-500" />
          <span>Available 1:1 Slot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-blue-600 bg-blue-500" />
          <span>My Booking</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-purple-600 bg-purple-500" />
          <span>Programme Session</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-border bg-muted" />
          <span className="text-muted-foreground">Outside Working Hours</span>
        </div>
      </div>

      {/* Weekly Grid View */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-187.5">
            <div
              className="grid grid-cols-[60px_repeat(var(--days-count),minmax(0,1fr))] border-b bg-muted/30"
              style={{ "--days-count": daysCount } as React.CSSProperties}
            >
              <div className="border-r p-3 text-center text-xs font-semibold text-muted-foreground">
                Time
              </div>
              {daysToRender.map((day) => {
                const isCurrent = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    suppressHydrationWarning
                    className={`min-w-0 border-r p-3 text-center last:border-r-0 ${
                      isCurrent ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="text-xs font-medium text-muted-foreground">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={`mt-0.5 inline-flex size-7 items-center justify-center rounded-full text-sm font-bold ${
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

            <div
              className="relative grid grid-cols-[60px_repeat(var(--days-count),minmax(0,1fr))]"
              style={
                {
                  "--days-count": daysCount,
                  height: `${(GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT_PX}px`,
                } as React.CSSProperties
              }
            >
              <div className="relative select-none border-r bg-muted/20">
                {HOURS.map((hour, idx) => (
                  <div
                    key={hour}
                    className="absolute -mt-2 w-full pr-2 text-right text-[11px] font-medium text-muted-foreground"
                    style={{ top: `${idx * HOUR_HEIGHT_PX}px` }}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {daysToRender.map((day) => {
                const wh = getWorkingHoursForDate(day, selectedWorkingHours);
                const dayEvents = positionEventsForDay(
                  eventsByDay.get(day.toDateString()) ?? [],
                );

                const gridStartMin = GRID_START_HOUR * 60;
                const gridEndMin = GRID_END_HOUR * 60;
                let whTopPx: number | null = null;
                let whHeightPx: number | null = null;
                if (wh) {
                  const cStart = Math.max(
                    gridStartMin,
                    Math.min(gridEndMin, wh.startMin),
                  );
                  const cEnd = Math.max(
                    gridStartMin,
                    Math.min(gridEndMin, wh.endMin),
                  );
                  whTopPx = ((cStart - gridStartMin) / 60) * HOUR_HEIGHT_PX;
                  whHeightPx = ((cEnd - cStart) / 60) * HOUR_HEIGHT_PX;
                }

                return (
                  <div
                    key={day.toISOString()}
                    className="relative min-w-0 border-r bg-muted/25 last:border-r-0"
                    style={{
                      height: `${(GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT_PX}px`,
                    }}
                  >
                    {whTopPx !== null && whHeightPx !== null && (
                      <div
                        className="absolute inset-x-0 bg-background"
                        style={{
                          top: `${whTopPx}px`,
                          height: `${whHeightPx}px`,
                        }}
                      />
                    )}

                    {HOURS.map((_, idx) => (
                      <div
                        key={idx}
                        className="pointer-events-none absolute inset-x-0 border-t border-border/40"
                        style={{ top: `${idx * HOUR_HEIGHT_PX}px` }}
                      >
                        <div
                          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/20"
                          style={{ top: `${HOUR_HEIGHT_PX / 2}px` }}
                        />
                      </div>
                    ))}

                    {dayEvents.map((ev) => {
                      const leftPercent = (ev.colIndex / ev.totalCols) * 100;
                      const widthPercent = 100 / ev.totalCols;

                      let bgClass = "";
                      if (ev.type === "open_slot") {
                        bgClass =
                          "bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700/80 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/90";
                      } else if (ev.type === "my_booking") {
                        bgClass =
                          "bg-blue-100 dark:bg-blue-950/90 text-blue-950 dark:text-blue-100 border-blue-300 dark:border-blue-700/80 hover:bg-blue-200/80 dark:hover:bg-blue-900/90";
                      } else {
                        bgClass =
                          "bg-purple-100 dark:bg-purple-950/90 text-purple-950 dark:text-purple-100 border-purple-300 dark:border-purple-700/80 hover:bg-purple-200/80 dark:hover:bg-purple-900/90";
                      }

                      const isSlotPending =
                        ev.type === "open_slot" &&
                        isPending &&
                        pendingSlotId === ev.slotId;

                      const inner = (
                        <>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-bold leading-tight">
                              {ev.type === "open_slot" && (
                                <Badge
                                  variant="outline"
                                  className="h-3.5 border-none bg-emerald-200 px-1 py-0 text-[9px] font-bold text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100"
                                >
                                  {isSlotPending ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Loader2 className="size-2.5 animate-spin" />
                                      Booking...
                                    </span>
                                  ) : (
                                    "Available"
                                  )}
                                </Badge>
                              )}
                              {ev.type === "my_booking" && (
                                <Badge
                                  variant="outline"
                                  className="h-3.5 border-none bg-blue-200 px-1 py-0 text-[9px] font-bold text-blue-950 dark:bg-blue-900 dark:text-blue-100"
                                >
                                  My Booking
                                </Badge>
                              )}
                            </div>

                            {ev.heightPx > 40 && (
                              <div className="mt-0.5 text-[10px] font-semibold leading-tight opacity-80">
                                <LocalTime value={ev.startsAt} format="time" />
                                {" – "}
                                <LocalTime value={ev.endsAt} format="time" />
                              </div>
                            )}

                            {ev.heightPx > 56 && (
                              <div className="mt-0.5 line-clamp-2 break-words text-[11px] font-bold leading-tight">
                                {ev.title}
                              </div>
                            )}

                            {ev.heightPx > 80 && ev.coachName && (
                              <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-semibold">
                                <User className="size-3 shrink-0 opacity-70" />
                                <span className="truncate">{ev.coachName}</span>
                              </div>
                            )}

                            {ev.heightPx > 80 && ev.specialty && (
                              <div className="truncate text-[10px] opacity-70">
                                {SPECIALTIES[ev.specialty] || ev.specialty}
                              </div>
                            )}
                          </div>

                          {ev.meetLink && ev.heightPx > 40 && (
                            <div className="mt-1 self-start">
                              <a
                                href={ev.meetLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                              >
                                <Video className="size-3" />
                                Meet
                              </a>
                            </div>
                          )}
                        </>
                      );

                      const sharedClass = `absolute z-10 flex flex-col justify-between overflow-hidden rounded-lg border p-1.5 text-xs shadow-2xs transition-all ${bgClass}`;

                      if (ev.type === "open_slot") {
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            disabled={isPending}
                            onClick={() => handleBookSlot(ev.slotId!)}
                            title="Book this slot"
                            className={`${sharedClass} cursor-pointer text-left`}
                            style={{
                              top: `${ev.topPx + 1}px`,
                              height: `${Math.max(20, ev.heightPx - 2)}px`,
                              left: `calc(${leftPercent}% + 2px)`,
                              width: `calc(${widthPercent}% - 4px)`,
                            }}
                          >
                            {inner}
                          </button>
                        );
                      }

                      return (
                        <div
                          key={ev.id}
                          className={sharedClass}
                          style={{
                            top: `${ev.topPx + 1}px`,
                            height: `${Math.max(20, ev.heightPx - 2)}px`,
                            left: `calc(${leftPercent}% + 2px)`,
                            width: `calc(${widthPercent}% - 4px)`,
                          }}
                        >
                          {inner}
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
