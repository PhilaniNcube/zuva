"use client";

import { useRef, useState, useTransition } from "react";

import { createCoach } from "../coach-actions";
import { SPECIALTIES } from "../specialties";

export function CoachCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    startTransition(async () => {
      setError(null);
      setCreated(null);
      const result = await createCoach({
        name: formData.get("name"),
        email,
        specialty: formData.get("specialty"),
        whatsappNumber: formData.get("whatsappNumber"),
        bio: formData.get("bio"),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCreated({ email, tempPassword: result.data.tempPassword });
      formRef.current?.reset();
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="mb-3 text-sm font-semibold">Add a coach / expert</h3>
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
          Specialty
          <select
            name="specialty"
            defaultValue="one_on_one"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {Object.entries(SPECIALTIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          WhatsApp number
          <input
            name="whatsappNumber"
            required
            placeholder="+233…"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Bio <span className="font-normal text-zinc-500">(optional)</span>
          <input
            name="bio"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Adding…" : "Add coach"}
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {created ? (
        <p className="mt-3 rounded bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          Account created for {created.email}. Temporary password:{" "}
          <code className="font-mono font-semibold">{created.tempPassword}</code>{" "}
          — share it securely; it is only shown once.
        </p>
      ) : null}
    </div>
  );
}
