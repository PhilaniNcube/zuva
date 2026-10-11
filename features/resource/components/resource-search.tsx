"use client";

import { useEffect, useState, useTransition } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Client-side search box for the scholar resource library.
 *
 * Keeps the query in the URL (`?q=`) so results stay shareable and the server
 * component refetches the filtered list. Typing is debounced before the URL
 * update to avoid a request per keystroke.
 */
export function ResourceSearch() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString
      .withDefault("")
      .withOptions({ shallow: false, startTransition }),
  );

  const [value, setValue] = useState(query);

  // Sync the input when the URL changes from elsewhere (clear, back/forward),
  // while preserving in-progress typing that trims to the same query.
  useEffect(() => {
    setValue((current) => (current.trim() === query ? current : query));
  }, [query]);

  // Debounce the URL update until the scholar pauses typing.
  useEffect(() => {
    if (value.trim() === query) return;
    const timer = setTimeout(() => {
      const next = value.trim();
      setQuery(next === "" ? null : next);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, query, setQuery]);

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search resources by title or description..."
        aria-label="Search resources"
        className="h-9 pl-9 pr-9 text-sm"
      />
      {isPending ? (
        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setValue("");
            setQuery(null);
          }}
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
