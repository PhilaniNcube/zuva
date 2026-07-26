"use client";

import { parseAsString, useQueryState } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "critical_review", label: "Critical Review" },
  { value: "language_editing", label: "Language Editing" },
  { value: "returned", label: "Returned" },
];

export function QueueFilter() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("").withOptions({ shallow: false }),
  );

  const selectedValue = !status ? "all" : status;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-700">Status:</span>
      <Select
        value={selectedValue}
        onValueChange={(val) => {
          if (!val || val === "all") {
            setStatus(null);
          } else {
            setStatus(val);
          }
        }}
      >
        <SelectTrigger className="w-[180px] bg-white text-zinc-900 border border-zinc-200 shadow-xs hover:bg-zinc-50">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent align="end" className="bg-white text-zinc-900 border border-zinc-200 shadow-md z-50">
          {STATUS_OPTIONS.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              className="text-zinc-900 focus:bg-zinc-100 focus:text-zinc-900 cursor-pointer"
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
