"use client";

/**
 * Renders a UTC timestamp in the viewer's browser timezone. All DB times are
 * UTC; never format them on the server for user-facing display.
 */
export function LocalTime({
  value,
  format = "datetime",
}: {
  value: Date;
  format?: "datetime" | "date" | "time";
}) {
  const options: Intl.DateTimeFormatOptions =
    format === "time"
      ? { timeStyle: "short" }
      : format === "date"
        ? { dateStyle: "medium" }
        : { dateStyle: "medium", timeStyle: "short" };
  return (
    <span suppressHydrationWarning>
      {value.toLocaleString(undefined, options)}
    </span>
  );
}
