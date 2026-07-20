"use client";

import { useState, useTransition } from "react";

import { updateCoach } from "../coach-actions";
import { SPECIALTIES, type Specialty } from "../specialties";

type Initial = {
  specialty: Specialty;
  whatsappNumber: string;
  bio: string;
};

export function CoachEditForm({
  coachUserId,
  initial,
}: {
  coachUserId: string;
  initial: Initial;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await updateCoach(coachUserId, {
        specialty: formData.get("specialty"),
        whatsappNumber: formData.get("whatsappNumber"),
        bio: formData.get("bio"),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700"
      >
        Edit
      </button>
    );
  }

  return (
    <form action={onSubmit} className="flex min-w-72 flex-col gap-2">
      <select
        name="specialty"
        defaultValue={initial.specialty}
        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        {Object.entries(SPECIALTIES).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        name="whatsappNumber"
        required
        defaultValue={initial.whatsappNumber}
        placeholder="WhatsApp number"
        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <input
        name="bio"
        defaultValue={initial.bio}
        placeholder="Bio (optional)"
        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
