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
  saveCoachWorkingHours,
  type WorkingHoursInput,
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

interface CoachWorkingHoursFormProps {
  initialWorkingHours?: WorkingHoursInput | null;
}

export function CoachWorkingHoursForm({
  initialWorkingHours,
}: CoachWorkingHoursFormProps) {
  const [isPending, startTransition] = useTransition();

  const [workingHours, setWorkingHours] = useState<WorkingHoursInput>(() => {
    if (!initialWorkingHours) return DEFAULT_WORKING_HOURS;
    return {
      days: initialWorkingHours.days ?? DEFAULT_WORKING_HOURS.days,
      start: initialWorkingHours.start ?? DEFAULT_WORKING_HOURS.start,
      end: initialWorkingHours.end ?? DEFAULT_WORKING_HOURS.end,
      slotDurationMinutes:
        initialWorkingHours.slotDurationMinutes ??
        DEFAULT_WORKING_HOURS.slotDurationMinutes,
      bufferMinutes:
        initialWorkingHours.bufferMinutes ?? DEFAULT_WORKING_HOURS.bufferMinutes,
      overrides: initialWorkingHours.overrides ?? [],
      blockedRanges: initialWorkingHours.blockedRanges ?? [],
    };
  });

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
      const updatedDays = exists
        ? prev.days.filter((d) => d !== dayId)
        : [...prev.days, dayId];
      return { ...prev, days: updatedDays };
    });
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
    if (workingHours.end <= workingHours.start) {
      toast.error("Weekly end time must be after start time.");
      return;
    }

    startTransition(async () => {
      const res = await saveCoachWorkingHours(workingHours);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.data?.slotsCreated !== undefined
          ? `Booking schedule saved! Generated ${res.data.slotsCreated} available slot(s).`
          : "Booking schedule saved successfully.",
      );
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

        {/* Time Windows & Duration */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700">
              Daily Start Time
            </label>
            <input
              type="time"
              required
              value={workingHours.start}
              onChange={(e) =>
                setWorkingHours((prev) => ({ ...prev, start: e.target.value }))
              }
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700">
              Daily End Time
            </label>
            <input
              type="time"
              required
              value={workingHours.end}
              onChange={(e) =>
                setWorkingHours((prev) => ({ ...prev, end: e.target.value }))
              }
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
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
