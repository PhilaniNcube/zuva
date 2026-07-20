"use client";

import { useRef, useState, useTransition } from "react";

import { createCohortSession } from "../session-actions";

export function CohortSessionForm({
  cohorts,
  coaches,
}: {
  cohorts: { id: string; name: string }[];
  coaches: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const startsAt = new Date(String(formData.get("startsAt"))).toISOString();
    const endsAt = new Date(String(formData.get("endsAt"))).toISOString();
    startTransition(async () => {
      setError(null);
      const result = await createCohortSession({
        cohortId: formData.get("cohortId"),
        type: formData.get("type"),
        title: formData.get("title"),
        description: formData.get("description"),
        coachId: formData.get("coachId"),
        startsAt,
        endsAt,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h3 className="text-sm font-semibold">Schedule a group session</h3>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Cohort
          <select
            name="cohortId"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Type
          <select
            name="type"
            defaultValue="masterclass"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="masterclass">Masterclass</option>
            <option value="orientation">Orientation</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Coach <span className="font-normal text-zinc-500">(optional)</span>
          <select
            name="coachId"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">—</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Title
          <input
            name="title"
            required
            placeholder="Academic Writing Masterclass II"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Start
          <input
            name="startsAt"
            type="datetime-local"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          End
          <input
            name="endsAt"
            type="datetime-local"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Description <span className="font-normal text-zinc-500">(optional)</span>
        <textarea
          name="description"
          rows={2}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Scheduling…" : "Schedule session"}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
