"use client";

import { useRef, useState, useTransition } from "react";

import { enrollScholar } from "../cohort-actions";

export function ScholarEnrollForm({ cohortId }: { cohortId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    startTransition(async () => {
      setError(null);
      setEnrolled(null);
      const result = await enrollScholar({
        cohortId,
        name: formData.get("name"),
        email,
        country: formData.get("country"),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEnrolled({ email, tempPassword: result.data.tempPassword });
      formRef.current?.reset();
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="mb-3 text-sm font-semibold">Enrol a new scholar</h3>
      <form ref={formRef} action={onSubmit} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Name
          <input
            name="name"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Country <span className="font-normal text-zinc-500">(optional)</span>
          <input
            name="country"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Enrolling…" : "Enrol scholar"}
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {enrolled ? (
        <p className="mt-3 rounded bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          Account created for {enrolled.email}. Temporary password:{" "}
          <code className="font-mono font-semibold">
            {enrolled.tempPassword}
          </code>{" "}
          — share it securely; it is only shown once.
        </p>
      ) : null}
    </div>
  );
}
