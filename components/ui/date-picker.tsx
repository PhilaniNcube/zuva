"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ClockIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  showTime?: boolean;
  className?: string;
}

function formatToDateTimeLocal(date: Date, timeStr: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T${timeStr}`;
}

function formatToDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  minDate,
  showTime = true,
  className,
}: DatePickerProps) {
  const date = value ? new Date(value) : undefined;
  const isValidDate = date && !isNaN(date.getTime());

  const timeValue = isValidDate ? format(date, "HH:mm") : "09:00";

  const defaultPlaceholder = showTime ? "Pick date & time" : "Pick a date";
  const displayPlaceholder = placeholder ?? defaultPlaceholder;

  const startOfMinDate = React.useMemo(() => {
    if (!minDate || isNaN(minDate.getTime())) return undefined;
    return new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  }, [minDate]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange("");
      return;
    }

    if (showTime) {
      onChange(formatToDateTimeLocal(selectedDate, timeValue));
    } else {
      onChange(formatToDateOnly(selectedDate));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    const baseDate = isValidDate ? date : (startOfMinDate ?? new Date());
    onChange(formatToDateTimeLocal(baseDate, newTime));
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal border-input bg-transparent dark:bg-input/30",
              !isValidDate && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" />
        {isValidDate ? (
          <span>
            {showTime ? format(date, "PPP 'at' p") : format(date, "PPP")}
          </span>
        ) : (
          <span>{displayPlaceholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 flex flex-col gap-3" align="start">
        <Calendar
          mode="single"
          selected={isValidDate ? date : undefined}
          onSelect={handleDateSelect}
          disabled={startOfMinDate ? { before: startOfMinDate } : undefined}
        />
        {showTime && (
          <div className="flex items-center justify-between border-t border-border pt-3 px-1 gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <ClockIcon className="size-3.5" />
              <span>Time</span>
            </div>
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="w-[120px] h-8 text-sm"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
