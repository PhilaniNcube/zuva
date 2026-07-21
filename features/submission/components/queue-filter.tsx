"use client";

import { parseAsString, useQueryState } from "nuqs";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
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

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Status:</label>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value || null)}
        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
