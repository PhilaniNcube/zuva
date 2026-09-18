"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Lock,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DEFAULT_WORKING_HOURS,
  type WorkingHoursInput,
} from "@/features/coach/working-hours";
import {
  adminSaveCoachWorkingHours,
  saveCoachWorkingHours,
} from "@/features/coach/coach-sync-actions";

const DAYS_OF_WEEK = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 0, label: "Sun" },
];

const DAY_LABELS: Record<number, string> = Object.fromEntries(
  DAYS_OF_WEEK.map((day) => [day.id, day.label]),
);

interface CoachWorkingHoursFormProps {
  initialWorkingHours?: WorkingHoursInput | null;
  coachUserId?: string;
  onSuccess?: () => void;
}

export function CoachWorkingHoursForm({
  initialWorkingHours,
  coachUserId,
  onSuccess,
}: CoachWorkingHoursFormProps) {
  const [isPending, startTransition] = useTransition();

  const [workingHours, setWorkingHours] = useState<WorkingHoursInput>(() => {
    if (!initialWorkingHours) return DEFAULT_WORKING_HOURS;
    const days = initialWorkingHours.days ?? DEFAULT_WORKING_HOURS.days;
    const start = initialWorkingHours.start ?? DEFAULT_WORKING_HOURS.start;
    const end = initialWorkingHours.end ?? DEFAULT_WORKING_HOURS.end;
    const existingDayHours = initialWorkingHours.dayHours ?? [];
    return {
      days,
      start,
      end,
      // Backfill per-day hours from the shared window for legacy rows.
      dayHours:
        existingDayHours.length > 0
          ? existingDayHours
          : days.map((day) => ({ day, start, end })),
      slotDurationMinutes:
        initialWorkingHours.slotDurationMinutes ??
        DEFAULT_WORKING_HOURS.slotDurationMinutes,
      bufferMinutes:
        initialWorkingHours.bufferMinutes ?? DEFAULT_WORKING_HOURS.bufferMinutes,
      overrides: initialWorkingHours.overrides ?? [],
      blockedRanges: initialWorkingHours.blockedRanges ?? [],
    };
  });

  const [bulkHours, setBulkHours] = useState(() => ({
    start: initialWorkingHours?.start ?? DEFAULT_WORKING_HOURS.start,
    end: initialWorkingHours?.end ?? DEFAULT_WORKING_HOURS.end,
  }));

  // State for adding a new date override
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideIsBlocked, setOverrideIsBlocked] = useState(true);
  const [overrideStart, setOverrideStart] = useState("10:00");
  const [overrideEnd, setOverrideEnd] = useState("14:00");

  // State for adding a new date range block (vacation)
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeReason, setRangeReason] = useState("");

  const toggleDay = (dayId: number) => {
    setWorkingHours((prev) => {
      const exists = prev.days.includes(dayId);
      if (exists) {
        return {
          ...prev,
          days: prev.days.filter((d) => d !== dayId),
          dayHours: (prev.dayHours ?? []).filter((d) => d.day !== dayId),
        };
      }

      const fallback =
        (prev.dayHours ?? []).find((d) => d.day === prev.days[0]) ?? {
          start: prev.start,
          end: prev.end,
        };

      return {
        ...prev,
        days: [...prev.days, dayId],
        dayHours: [
          ...(prev.dayHours ?? []).filter((d) => d.day !== dayId),
          { day: dayId, start: fallback.start, end: fallback.end },
        ],
      };
    });
  };

  const updateDayHours = (
    dayId: number,
    field: "start" | "end",
    value: string,
  ) => {
    setWorkingHours((prev) => ({
      ...prev,
      dayHours: (prev.dayHours ?? []).map((d) =>
        d.day === dayId ? { ...d, [field]: value } : d,
      ),
    }));
  };

  const applyBulkHours = () => {
    if (bulkHours.end <= bulkHours.start) {
      toast.error("End time must be after start time.");
      return;
    }
    setWorkingHours((prev) => ({
      ...prev,
      start: bulkHours.start,
      end: bulkHours.end,
      dayHours: prev.days.map((day) => ({
        day,
        start: bulkHours.start,
        end: bulkHours.end,
      })),
    }));
    toast.success("Applied to all active days");
  };

  const handleAddOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideDate) {
      toast.error("Please pick a date");
      return;
    }

    setWorkingHours((prev) => {
      const existing = (prev.overrides || []).filter(
        (o) => o.date !== overrideDate,
      );
      const newOverride = overrideIsBlocked
        ? { date: overrideDate, isBlocked: true }
        : {
            date: overrideDate,
            isBlocked: false,
            start: overrideStart,
            end: overrideEnd,
          };
      return { ...prev, overrides: [...existing, newOverride] };
    });

    setOverrideDate("");
    toast.success(`Added override for ${overrideDate}`);
  };

  const handleRemoveOverride = (dateStr: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      overrides: (prev.overrides || []).filter((o) => o.date !== dateStr),
    }));
  };

  const handleAddRangeBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeStart || !rangeEnd) {
      toast.error("Please select both start and end dates");
      return;
    }
    if (rangeEnd < rangeStart) {
      toast.error("End date must be after start date");
      return;
    }

    const newBlock = {
      id: crypto.randomUUID(),
      startDate: rangeStart,
      endDate: rangeEnd,
      reason: rangeReason.trim() || "Out of office",
    };

    setWorkingHours((prev) => ({
      ...prev,
      blockedRanges: [...(prev.blockedRanges || []), newBlock],
    }));

    setRangeStart("");
    setRangeEnd("");
    setRangeReason("");
    toast.success("Added vacation / range block");
  };

  const handleRemoveRangeBlock = (id: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      blockedRanges: (prev.blockedRanges || []).filter((r) => r.id !== id),
    }));
  };

  const handleSave = () => {
    if (workingHours.days.length === 0) {
      toast.error("Please select at least one day for your weekly schedule.");
      return;
    }

    const orderedDays = DAYS_OF_WEEK.map((d) => d.id).filter((id) =>
      workingHours.days.includes(id),
    );
    const dayHoursByDay = new Map(
      (workingHours.dayHours ?? []).map((d) => [d.day, d]),
    );

    for (const dayId of orderedDays) {
      const entry = dayHoursByDay.get(dayId);
      if (!entry) {
        toast.error(`Please set working hours for ${DAY_LABELS[dayId]}.`);
        return;
      }
      if (entry.end <= entry.start) {
        toast.error(`${DAY_LABELS[dayId]}: end time must be after start time.`);
        return;
      }
    }

    const firstDay = dayHoursByDay.get(orderedDays[0])!;
    const payload: WorkingHoursInput = {
      ...workingHours,
      days: orderedDays,
      start: firstDay.start,
      end: firstDay.end,
      dayHours: orderedDays.map((day) => dayHoursByDay.get(day)!),
    };

    startTransition(async () => {
      const res = coachUserId
        ? await adminSaveCoachWorkingHours({
            coachUserId,
            workingHours: payload,
          })
        : await saveCoachWorkingHours(payload);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.data?.slotsCreated !== undefined
          ? `Booking schedule saved! Generated ${res.data.slotsCreated} available slot(s).`
          : "Booking schedule saved successfully.",
      );
      if (onSuccess) {
        onSuccess();
      }
    });
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
            <Clock className="h-5 w-5 text-zinc-700" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">
              Accepted Booking Windows
            </h3>
            <p className="text-xs text-zinc-500">
              Set the days and times scholars are permitted to book 1:1 sessions with you.
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? "Saving..." : "Save Schedule"}
        </Button>
      </div>

      {/* 1. Recurring Weekly Schedule */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 uppercase tracking-wider">
          <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
          Weekly Recurring Hours
        </div>

        {/* Days of Week */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-700">
            Active Days
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isActive = workingHours.days.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors border ${
                    isActive
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Apply same hours to all active days */}
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
          <span className="text-xs font-medium text-zinc-700">
            Apply same hours to all active days
          </span>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-zinc-500">Start</label>
              <input
                type="time"
                value={bulkHours.start}
                onChange={(e) =>
                  setBulkHours((prev) => ({ ...prev, start: e.target.value }))
                }
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-hidden"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-zinc-500">End</label>
              <input
                type="time"
                value={bulkHours.end}
                onChange={(e) =>
                  setBulkHours((prev) => ({ ...prev, end: e.target.value }))
                }
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-hidden"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyBulkHours}
              disabled={workingHours.days.length === 0}
              className="text-xs"
            >
              Apply to all days
            </Button>
          </div>
        </div>

        {/* Per-day hours */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-zinc-700">
            Working Hours by Day
          </label>
          {workingHours.days.length === 0 ? (
            <p className="text-xs text-zinc-500">
              Select at least one active day above.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {DAYS_OF_WEEK.filter((day) =>
                workingHours.days.includes(day.id),
              ).map((day) => {
                const entry = (workingHours.dayHours ?? []).find(
                  (d) => d.day === day.id,
                );
                if (!entry) return null;
                return (
                  <div
                    key={day.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2"
                  >
                    <span className="w-9 text-xs font-semibold text-zinc-800">
                      {day.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={entry.start}
                        onChange={(e) =>
                          updateDayHours(day.id, "start", e.target.value)
                        }
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-hidden"
                      />
                      <span className="text-xs text-zinc-400">to</span>
                      <input
                        type="time"
                        value={entry.end}
                        onChange={(e) =>
                          updateDayHours(day.id, "end", e.target.value)
                        }
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      title={`Remove ${day.label}`}
                      className="ml-auto text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Session Duration */}
        <div className="flex flex-col gap-1.5 sm:max-w-xs">
          <label className="text-xs font-medium text-zinc-700">
            Session Duration
          </label>
          <select
            value={workingHours.slotDurationMinutes}
            onChange={(e) =>
              setWorkingHours((prev) => ({
                ...prev,
                slotDurationMinutes: Number(e.target.value),
              }))
            }
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-hidden"
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes (1 hour)</option>
            <option value={90}>90 minutes (1.5 hours)</option>
          </select>
        </div>
      </div>

      {/* 2. Specific Date & Future Range Overrides */}
      <div className="flex flex-col gap-4 border-t border-zinc-100 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 uppercase tracking-wider">
            <Calendar className="h-4 w-4 text-zinc-500" />
            Date & Week Overrides / Out of Office
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Add Single Date Override */}
          <form
            onSubmit={handleAddOverride}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4"
          >
            <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-zinc-500" />
              Single Date Override / Block
            </span>
            <p className="text-[11px] text-zinc-500">
              Block a specific date or specify custom hours for that day.
            </p>

            <div className="flex flex-col gap-2">
              <input
                type="date"
                required
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-hidden"
              />

              <div className="flex items-center gap-4 py-1">
                <label className="flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="overrideType"
                    checked={overrideIsBlocked}
                    onChange={() => setOverrideIsBlocked(true)}
                    className="h-3.5 w-3.5 text-zinc-900"
                  />
                  Fully Block Day
                </label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="overrideType"
                    checked={!overrideIsBlocked}
                    onChange={() => setOverrideIsBlocked(false)}
                    className="h-3.5 w-3.5 text-zinc-900"
                  />
                  Custom Hours
                </label>
              </div>

              {!overrideIsBlocked && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={overrideStart}
                    onChange={(e) => setOverrideStart(e.target.value)}
                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs"
                  />
                  <span className="text-xs text-zinc-400">to</span>
                  <input
                    type="time"
                    value={overrideEnd}
                    onChange={(e) => setOverrideEnd(e.target.value)}
                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs"
                  />
                </div>
              )}

              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="mt-1 justify-center gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Date Override
              </Button>
            </div>
          </form>

          {/* Add Range / Vacation Block */}
          <form
            onSubmit={handleAddRangeBlock}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4"
          >
            <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              Vacation / Multi-Day Block
            </span>
            <p className="text-[11px] text-zinc-500">
              Block an entire week or date range in the future.
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  required
                  placeholder="Start Date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900"
                />
                <span className="text-xs text-zinc-400">to</span>
                <input
                  type="date"
                  required
                  placeholder="End Date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900"
                />
              </div>

              <input
                type="text"
                placeholder="Reason (e.g. Annual Leave)"
                value={rangeReason}
                onChange={(e) => setRangeReason(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-hidden"
              />

              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="mt-1 justify-center gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Vacation Block
              </Button>
            </div>
          </form>
        </div>

        {/* List Active Overrides & Blocks */}
        {((workingHours.overrides && workingHours.overrides.length > 0) ||
          (workingHours.blockedRanges &&
            workingHours.blockedRanges.length > 0)) && (
          <div className="flex flex-col gap-3 pt-2">
            <span className="text-xs font-semibold text-zinc-700">
              Active Date & Range Overrides
            </span>
            <div className="flex flex-wrap gap-2">
              {workingHours.overrides?.map((ov) => (
                <div
                  key={ov.date}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-800"
                >
                  <span className="font-mono font-medium">{ov.date}</span>
                  <span className="text-[11px] text-zinc-500">
                    {ov.isBlocked ? "Blocked" : `${ov.start}–${ov.end}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOverride(ov.date)}
                    className="text-zinc-400 hover:text-red-600 transition-colors ml-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {workingHours.blockedRanges?.map((range) => (
                <div
                  key={range.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs text-amber-900"
                >
                  <span className="font-mono font-medium">
                    {range.startDate} to {range.endDate}
                  </span>
                  {range.reason && (
                    <span className="text-[11px] text-amber-700 font-medium">
                      ({range.reason})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveRangeBlock(range.id)}
                    className="text-amber-500 hover:text-red-600 transition-colors ml-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
