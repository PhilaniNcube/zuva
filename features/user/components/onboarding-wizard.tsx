"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";

import { completeOnboarding } from "@/features/user/user-actions";

const schema = z.object({
  country: z.string().trim().min(2, "Country is required").max(100),
  degree: z
    .string()
    .trim()
    .max(150)
    .optional()
    .or(z.literal("")),
  institution: z
    .string()
    .trim()
    .max(150)
    .optional()
    .or(z.literal("")),
  whatsappNumber: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal("")),
  linkedinUrl: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal("")),
  bio: z.string().trim().min(10, "Bio is required").max(2000),
  mtpText: z.string().trim().min(5, "MTP is required").max(500),
});

type FormValues = z.infer<typeof schema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return completeOnboarding({
    country: formData.get("country"),
    degree: formData.get("degree"),
    institution: formData.get("institution"),
    whatsappNumber: formData.get("whatsappNumber"),
    linkedinUrl: formData.get("linkedinUrl"),
    bio: formData.get("bio"),
    mtpText: formData.get("mtpText"),
  });
}

type InitialValues = {
  country: string;
  degree?: string;
  institution?: string;
  whatsappNumber: string;
  linkedinUrl?: string;
  bio: string;
  mtpText: string;
};

const STEPS = ["Welcome", "How the hub works", "Your profile"] as const;

export function OnboardingWizard({ initial }: { initial: InitialValues }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, formAction, isPending] = useActionState(action, null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Onboarding complete!");
      router.push("/pathway");
      router.refresh();
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, router]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("country", data.country);
    formData.set("degree", data.degree ?? "");
    formData.set("institution", data.institution ?? "");
    formData.set("whatsappNumber", data.whatsappNumber ?? "");
    formData.set("linkedinUrl", data.linkedinUrl ?? "");
    formData.set("bio", data.bio);
    formData.set("mtpText", data.mtpText);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div className="w-full max-w-2xl rounded-lg border border-zinc-200 p-8 dark:border-zinc-800">
      <div className="mb-6 flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1.5 rounded transition-colors ${i <= step ? "bg-primary" : "bg-zinc-200"}`}
            />
            <p className="mt-1 text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Welcome to ZUVA Scholar Hub</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            This hub consolidates your postgraduate coaching journey with Concept
            Afrika / MINDS — 1:1 coaching, masterclasses, paper editing, and
            feedback.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            Let&apos;s take two quick steps to set up your profile.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Key features</h1>
          <ul className="flex flex-col gap-2.5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <strong>Pathway</strong> — your step-by-step progress from
              orientation to certificate eligibility.
            </li>
            <li>
              <strong>Sessions & Bookings</strong> — view group masterclasses and
              book 1:1 coaching slots.
            </li>
            <li>
              <strong>Editing Queue</strong> — submit research papers for critical
              review and language editing, then track status through to
              &ldquo;Returned&rdquo;.
            </li>
            <li>
              <strong>Feedback</strong> — short post-session forms (anonymous if
              you prefer). Five completed forms count toward your certificate.
            </li>
          </ul>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Your profile</h1>

          <Field>
            <FieldLabel>Country</FieldLabel>
            <Input {...form.register("country")} placeholder="e.g. Zimbabwe" />
            <FieldError errors={[form.formState.errors.country]} />
          </Field>

          <Field>
            <FieldLabel>Institution / University (optional)</FieldLabel>
            <Input {...form.register("institution")} placeholder="e.g. University of Cape Town" />
            <FieldError errors={[form.formState.errors.institution]} />
          </Field>

          <Field>
            <FieldLabel>Degree / Qualification (optional)</FieldLabel>
            <Input {...form.register("degree")} placeholder="e.g. MSc Public Health" />
            <FieldError errors={[form.formState.errors.degree]} />
          </Field>

          <Field>
            <FieldLabel>WhatsApp number (optional, international format)</FieldLabel>
            <Input {...form.register("whatsappNumber")} placeholder="+263…" />
            <FieldError errors={[form.formState.errors.whatsappNumber]} />
          </Field>

          <Field>
            <FieldLabel>LinkedIn Profile URL (optional)</FieldLabel>
            <Input {...form.register("linkedinUrl")} placeholder="https://linkedin.com/in/username" />
            <FieldError errors={[form.formState.errors.linkedinUrl]} />
          </Field>

          <Field>
            <FieldLabel>Short bio</FieldLabel>
            <Textarea
              {...form.register("bio")}
              rows={4}
              placeholder="Your research area, background, and what you are working on…"
            />
            <FieldError errors={[form.formState.errors.bio]} />
          </Field>

          <Field>
            <FieldLabel>Your Massive Transformative Purpose (MTP)</FieldLabel>
            <Textarea
              {...form.register("mtpText")}
              rows={2}
              placeholder="The big change you want to see in the world…"
            />
            <FieldError errors={[form.formState.errors.mtpText]} />
          </Field>

          <FieldDescription>
            Your MTP appears on your ZUVA certificate when you complete the
            programme.
          </FieldDescription>

          <div className="mt-2 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isPending}
            >
              Back
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Finish and go to my pathway"}
            </Button>
          </div>
        </form>
      )}

      {step < STEPS.length - 1 && (
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
        </div>
      )}
    </div>
  );
}
