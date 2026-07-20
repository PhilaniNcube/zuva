"use client";

import { useState, useTransition } from "react";

import {
  bookSlot,
  cancelBooking,
  cancelCohortSession,
  cancelSlot,
} from "../session-actions";

function useActionButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return { error, setError, pending, startTransition };
}

const buttonClass =
  "rounded border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700";

export function CancelSlotButton({ slotId }: { slotId: string }) {
  const { error, setError, pending, startTransition } = useActionButton();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await cancelSlot(slotId);
            if (!result.ok) setError(result.error);
          })
        }
        className={buttonClass}
      >
        Cancel slot
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}

export function BookSlotButton({
  slotId,
  children,
}: {
  slotId: string;
  children: React.ReactNode;
}) {
  const { error, setError, pending, startTransition } = useActionButton();
  const [booked, setBooked] = useState(false);

  if (booked) {
    return (
      <span className="rounded bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
        Booked!
      </span>
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
            const result = await bookSlot(slotId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setBooked(true);
          })
        }
        className="rounded border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {children}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const { error, setError, pending, startTransition } = useActionButton();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await cancelBooking(bookingId);
            if (!result.ok) setError(result.error);
          })
        }
        className={buttonClass}
      >
        Cancel booking
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}

export function CancelSessionButton({ sessionId }: { sessionId: string }) {
  const { error, setError, pending, startTransition } = useActionButton();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await cancelCohortSession(sessionId);
            if (!result.ok) setError(result.error);
          })
        }
        className={buttonClass}
      >
        Cancel session
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
