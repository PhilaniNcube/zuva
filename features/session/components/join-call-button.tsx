"use client";

import { useState, useTransition } from "react";

import { joinCall } from "../session-actions";

export function JoinCallButton({
  sessionId,
  meetLinkAvailable,
}: {
  sessionId: string;
  meetLinkAvailable: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!meetLinkAvailable) {
    return (
      <span className="text-xs text-zinc-500">Meet link pending</span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await joinCall(sessionId);
            if (result && !result.ok) setError(result.error);
          })
        }
        className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Joining…" : "Join Call"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
