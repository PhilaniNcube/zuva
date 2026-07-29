"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  LayoutList,
  User,
} from "lucide-react";

import { LocalTime } from "@/components/local-time";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JoinCallButton } from "./join-call-button";
import { CancelSlotButton } from "./slot-buttons";

export interface SlotItem {
  slotId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  bookingId?: string | null;
  scholarName?: string | null;
  sessionId?: string | null;
  meetLink?: string | null;
}

export function CoachSlotsView({ slots }: { slots: SlotItem[] }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "table">("day");

  const visibleSlots = slots.filter((s) => s.status !== "cancelled");

  // Dates with active slots
  const datesWithSlots = new Set(
    visibleSlots.map((s) => new Date(s.startsAt).toDateString()),
  );

  // Filter slots for currently selected date
  const selectedDaySlots = selectedDate
    ? visibleSlots.filter(
      (s) =>
        new Date(s.startsAt).toDateString() === selectedDate.toDateString(),
    )
    : [];

  if (visibleSlots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 mb-3">
          <CalendarIcon className="h-5 w-5 text-zinc-500" />
        </div>
        <h4 className="text-sm font-medium text-zinc-900">No synced slots available</h4>
        <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
          Add events titled <code className="font-semibold text-zinc-800">#zuva</code> or <code className="font-semibold text-zinc-800">ZUVA</code> to your linked calendar feed, then click <strong>"Sync Calendar Now"</strong> above.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Date Picker Popover Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Popover Date-Picker Button */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className="h-10 justify-between gap-3 border-zinc-200 bg-zinc-50 px-3.5 text-xs font-medium text-zinc-900 hover:bg-zinc-100 sm:text-sm"
                >
                  <span className="flex items-center gap-2" suppressHydrationWarning>
                    <CalendarIcon className="h-4 w-4 text-emerald-600" />
                    {selectedDate
                      ? selectedDate.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                      : "Select Date"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </Button>
              }
            />
            <PopoverContent className="w-auto p-3" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  if (d) {
                    setSelectedDate(d);
                    setPopoverOpen(false);
                  }
                }}
                modifiers={{
                  hasSlot: (date) => datesWithSlots.has(date.toDateString()),
                }}
                modifiersClassNames={{
                  hasSlot:
                    "bg-emerald-50 text-emerald-900 font-bold underline decoration-emerald-500",
                }}
              />
              <p className="mt-2 border-t border-zinc-100 pt-2 text-center text-[11px] text-zinc-400">
                Underlined dates have synced #zuva coaching slots
              </p>
            </PopoverContent>
          </Popover>

          <span className="hidden text-xs font-medium text-zinc-500 sm:inline">
            {selectedDaySlots.length} slot(s) on selected date
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("day")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "day"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            Day View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "table"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
          >
            <LayoutList className="h-3.5 w-3.5" />
            All Slots List ({visibleSlots.length})
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === "day" ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className=''>
              <h4 className="text-sm font-semibold text-zinc-900" suppressHydrationWarning>
                {selectedDate
                  ? selectedDate.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                  : "Select a date"}
              </h4>
              <p className="text-xs text-zinc-500">
                Synced 1:1 availability for this date
              </p>
            </div>
          </div>

          {selectedDaySlots.length === 0 ? (
            <div className="my-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
              <Clock className="mx-auto mb-2 h-7 w-7 text-zinc-400" />
              <p className="text-xs font-medium text-zinc-700">
                No slots synced for this date
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                Click the date picker above to pick an underlined date, or add a{" "}
                <code className="font-semibold text-zinc-800">#zuva</code> event
                to your calendar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedDaySlots.map((s) => (
                <div
                  key={s.slotId}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-900">
                          <LocalTime value={s.startsAt} format="time" /> –{" "}
                          <LocalTime value={s.endsAt} format="time" />
                        </div>
                        {s.scholarName && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-600">
                            <User className="h-3 w-3 text-zinc-400" />
                            {s.scholarName}
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${s.status === "booked"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                    >
                      {s.status === "open" ? "Open (Synced)" : "Booked"}
                    </span>
                  </div>

                  <div className="flex items-center justify-end border-t border-zinc-100 pt-3.5">
                    {s.status === "open" ? (
                      <CancelSlotButton slotId={s.slotId} />
                    ) : s.sessionId ? (
                      <JoinCallButton
                        sessionId={s.sessionId}
                        meetLinkAvailable={!!s.meetLink}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead className="w-[300px]">Time Slot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scholar</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSlots.map((s) => (
                <TableRow key={s.slotId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-zinc-900 sm:text-sm">
                        <LocalTime value={s.startsAt} /> –{" "}
                        <LocalTime value={s.endsAt} format="time" />
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${s.status === "booked"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                    >
                      {s.status === "open" ? "Open (Synced)" : "Booked"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600 sm:text-sm">
                    {s.scholarName ?? "—"}
                  </TableCell>
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
        </div>
      )}
    </div>
  );
}
