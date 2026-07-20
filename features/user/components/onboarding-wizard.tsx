"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { completeOnboarding } from "@/features/user/user-actions";

type InitialValues = {
  country: string;
  whatsappNumber: string;
  bio: string;
  mtpText: string;
};

const STEPS = ["Welcome", "How the hub works", "Your profile"] as const;

export function OnboardingWizard({ initial }: { initial: InitialValues }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await completeOnboarding({
        country: formData.get("country"),
        whatsappNumber: formData.get("whatsappNumber"),
        bio: formData.get("bio"),
        mtpText: formData.get("mtpText"),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/pathway");
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-2xl rounded-lg border border-zinc-200 p-8 dark:border-zinc-800">
      <div className="mb-6 flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1.5 rounded ${i <= step ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-800"}`}
            />
            <p className="mt-1 text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Welcome to ZUVA</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            ZUVA is a postgraduate coaching programme delivered by Concept
            Afrika on behalf of MINDS. Across your intake you will attend an
            orientation, join expert-led masterclasses (Academic Writing,
            Leadership, and Data &amp; Decisions), and work 1:1 with a dedicated
            coach as you develop your research.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            When you complete the journey — including five session feedback
            forms — you will earn your ZUVA certificate, personalised with your
            Massive Transformative Purpose.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">How the hub works</h1>
          <ul className="list-disc space-y-2 pl-5 text-zinc-600 dark:text-zinc-400">
            <li>
              <strong>My Learning Pathway</strong> — your full checklist, always
              visible. Nothing is locked; track your progress at a glance.
            </li>
            <li>
              <strong>Sessions</strong> — view coach availability, book 1:1s and
              masterclasses, and join the video call with one tap. Attendance is
              logged automatically when you join.
            </li>
            <li>
              <strong>Submissions</strong> — upload documents for critical
              review and language editing, and follow each one through to
              &ldquo;Returned&rdquo;.
            </li>
            <li>
              <strong>Feedback</strong> — short post-session forms (anonymous if
              you prefer). Five completed forms count toward your certificate.
            </li>
            <li>
              <strong>My Certificate</strong> — watch your eligibility tracker
              fill up, then download your certificate right here.
            </li>
          </ul>
        </div>
      )}

      {step === 2 && (
        <form action={onSubmit} className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Your profile</h1>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Country
            <input
              name="country"
              required
              defaultValue={initial.country}
              placeholder="e.g. Zimbabwe"
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            WhatsApp number{" "}
            <span className="font-normal text-zinc-500">
              (optional, international format)
            </span>
            <input
              name="whatsappNumber"
              defaultValue={initial.whatsappNumber}
              placeholder="+263…"
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Short bio
            <textarea
              name="bio"
              required
              rows={4}
              defaultValue={initial.bio}
              placeholder="Your research area, background, and what you are working on…"
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Your Massive Transformative Purpose (MTP)
            <textarea
              name="mtpText"
              required
              rows={2}
              defaultValue={initial.mtpText}
              placeholder="The big change you want to see in the world…"
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <p className="text-xs text-zinc-500">
            Your MTP appears on your ZUVA certificate when you complete the
            programme.
          </p>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="mt-2 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={pending}
              className="rounded border border-zinc-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-zinc-700"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {pending ? "Saving…" : "Finish and go to my pathway"}
            </button>
          </div>
        </form>
      )}

      {step < STEPS.length - 1 && (
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded border border-zinc-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-zinc-700"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
