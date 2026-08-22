"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Clock,
  LayoutList,
  Loader2,
  Sparkles,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SPECIALTIES, type Specialty } from "@/features/coach/specialties";
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
  whatsappNumber?: string | null;
  bio?: string | null;
}

export function BookingBrowserClient({
  slots,
  topics,
  coaches,
}: {
  slots: OpenSlotItem[];
  topics: CoachingTopic[];
  coaches: CoachItem[];
}) {
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [selectedCoachId, setSelectedCoachId] = useState<string>("all");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "table">("day");
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);
  const [bookedSlotIds, setBookedSlotIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Calculate slot counts per coach
  const coachSlotCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const slot of slots) {
      counts.set(slot.coachId, (counts.get(slot.coachId) ?? 0) + 1);
    }
    return counts;
  }, [slots]);

  // Filter slots by selected coach
  const filteredSlots = useMemo(() => {
    if (selectedCoachId === "all") return slots;
    return slots.filter((s) => s.coachId === selectedCoachId);
  }, [slots, selectedCoachId]);

  // Dates with available slots for the active filter
  const datesWithSlots = useMemo(() => {
    return new Set(
      filteredSlots.map((s) => new Date(s.startsAt).toDateString()),
    );
  }, [filteredSlots]);

  // Initial selected date defaults to the first available slot date or today
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (slots.length > 0) {
      return new Date(slots[0].startsAt);
    }
    return new Date();
  });

  // Filter slots for currently selected date
  const selectedDaySlots = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toDateString();
    return filteredSlots.filter(
      (s) => new Date(s.startsAt).toDateString() === dateStr,
    );
  }, [filteredSlots, selectedDate]);

  const handleBookSlot = (slotId: string) => {
    if (!topicId) {
      setErrorMessage("Please select a coaching topic first.");
      return;
    }

    setBookingSlotId(slotId);
    setErrorMessage(null);

    startTransition(async () => {
      const result = await bookSlot(slotId, topicId);
      if (!result.ok) {
        setErrorMessage(result.error);
        setBookingSlotId(null);
        return;
      }
      setBookedSlotIds((prev) => new Set(prev).add(slotId));
      setBookingSlotId(null);
    });
  };

  const selectedCoachObj = coaches.find((c) => c.id === selectedCoachId);

  // Precompute select items so Base UI Select renders the name/label and not the ID
  const coachSelectItems = useMemo(() => {
    const allItem = {
      value: "all",
      label: `All Coaches (${slots.length} available slots)`,
      displayLabel: `All Coaches (${slots.length} available slots)`,
    };
    const coachItems = coaches.map((c) => {
      const count = coachSlotCounts.get(c.id) ?? 0;
      const specialtyText = c.specialty
        ? SPECIALTIES[c.specialty] || c.specialty
        : null;
      return {
        value: c.id,
        label: c.name,
        displayLabel: `${c.name}${specialtyText ? ` • ${specialtyText}` : ""} (${count} ${count === 1 ? "slot" : "slots"})`,
      };
    });
    return [allItem, ...coachItems];
  }, [slots.length, coaches, coachSlotCounts]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Filter & Topic Section */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Coach Dropdown */}
          <div className="flex flex-col gap-1.5 sm:max-w-xs w-full">
            <label className="text-xs font-semibold text-zinc-700">
              Filter by Coach
            </label>
            <Select
              value={selectedCoachId}
              onValueChange={(val) => {
                if (val) {
                  setSelectedCoachId(val);
                  // If changing coach and current selected date has no slots for new coach, pick first slot date
                  const coachSlots =
                    val === "all" ? slots : slots.filter((s) => s.coachId === val);
                  if (
                    coachSlots.length > 0 &&
                    selectedDate &&
                    !coachSlots.some(
                      (s) =>
                        new Date(s.startsAt).toDateString() ===
                        selectedDate.toDateString(),
                    )
                  ) {
                    setSelectedDate(new Date(coachSlots[0].startsAt));
                  }
                }
              }}
              items={coachSelectItems}
            >
              <SelectTrigger className="h-10 w-full bg-white border-zinc-200 text-xs sm:text-sm font-medium">
                <SelectValue placeholder="All Coaches">
                  {selectedCoachId === "all"
                    ? `All Coaches (${slots.length} available slots)`
                    : selectedCoachObj
                      ? selectedCoachObj.name
                      : "All Coaches"}
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

          {/* Coach Profile Summary Badge if specific coach selected */}
          {selectedCoachObj && (
            <div className="flex items-center gap-3 rounded-lg bg-zinc-50 px-3.5 py-2 border border-zinc-200/80 text-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 font-semibold">
                {selectedCoachObj.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-zinc-900">{selectedCoachObj.name}</p>
                <p className="text-zinc-500">
                  {selectedCoachObj.specialty
                    ? SPECIALTIES[selectedCoachObj.specialty]
                    : "ZUVA Coach"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Coaching Topic Selector */}
        <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3">
          <span className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
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

        {errorMessage && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            {errorMessage}
          </div>
        )}
      </div>

      {filteredSlots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-10 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 mb-3">
            <CalendarIcon className="h-5 w-5 text-zinc-500" />
          </div>
          <h4 className="text-sm font-medium text-zinc-900">
            {selectedCoachId === "all"
              ? "No open slots right now"
              : `No open slots right now for ${selectedCoachObj?.name ?? "this coach"}`}
          </h4>
          <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
            Coaches publish availability regularly. You can switch to another coach or check back soon.
          </p>
          {selectedCoachId !== "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCoachId("all")}
              className="mt-4 text-xs"
            >
              View All Coaches
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
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
                    Underlined dates have available 1:1 coaching slots
                  </p>
                </PopoverContent>
              </Popover>

              <span className="hidden text-xs font-medium text-zinc-500 sm:inline">
                {selectedDaySlots.length} available slot(s) on selected date
              </span>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("day")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "day"
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
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" />
                All Slots List ({filteredSlots.length})
              </button>
            </div>
          </div>

          {/* Main View Area */}
          {viewMode === "day" ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
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
                    Available 1:1 coaching slots for this date
                  </p>
                </div>
              </div>

              {selectedDaySlots.length === 0 ? (
                <div className="my-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
                  <Clock className="mx-auto mb-2 h-7 w-7 text-zinc-400" />
                  <p className="text-xs font-medium text-zinc-700">
                    No slots available for this date
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Pick an underlined date in the date picker above, or select another coach from the dropdown.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedDaySlots.map((slot) => {
                    const isBooked = bookedSlotIds.has(slot.slotId);
                    const isSlotPending = isPending && bookingSlotId === slot.slotId;

                    return (
                      <div
                        key={slot.slotId}
                        className="flex flex-col justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 transition-all hover:bg-zinc-50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              <Clock className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-zinc-900">
                                <LocalTime value={slot.startsAt} format="time" /> –{" "}
                                <LocalTime value={slot.endsAt} format="time" />
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-600">
                                <User className="h-3 w-3 text-zinc-400" />
                                <span className="font-medium text-zinc-800">
                                  {slot.coachName}
                                </span>
                              </div>
                              {slot.specialty && (
                                <p className="text-[10px] text-zinc-500">
                                  {SPECIALTIES[slot.specialty] || slot.specialty}
                                </p>
                              )}
                            </div>
                          </div>

                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Available
                          </span>
                        </div>

                        <div className="flex items-center justify-end border-t border-zinc-100 pt-3">
                          {isBooked ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                              <Check className="h-3.5 w-3.5" /> Booked!
                            </span>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              disabled={isPending || !topicId}
                              onClick={() => handleBookSlot(slot.slotId)}
                              className="h-8 gap-1.5 bg-zinc-900 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                            >
                              {isSlotPending ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Booking...
                                </>
                              ) : (
                                "Book this slot"
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/50">
                    <TableHead className="w-[260px]">Time Slot</TableHead>
                    <TableHead>Coach</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSlots.map((slot) => {
                    const isBooked = bookedSlotIds.has(slot.slotId);
                    const isSlotPending = isPending && bookingSlotId === slot.slotId;

                    return (
                      <TableRow key={slot.slotId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              <Clock className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-medium text-zinc-900 sm:text-sm">
                              <LocalTime value={slot.startsAt} /> –{" "}
                              <LocalTime value={slot.endsAt} format="time" />
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-zinc-800 sm:text-sm">
                          {slot.coachName}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500 sm:text-sm">
                          {slot.specialty
                            ? SPECIALTIES[slot.specialty] || slot.specialty
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {isBooked ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                              <Check className="h-3.5 w-3.5" /> Booked!
                            </span>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              disabled={isPending || !topicId}
                              onClick={() => handleBookSlot(slot.slotId)}
                              className="h-8 gap-1.5 bg-zinc-900 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                            >
                              {isSlotPending ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Booking...
                                </>
                              ) : (
                                "Book this slot"
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
