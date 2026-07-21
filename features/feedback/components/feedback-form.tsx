"use client";

import { useActionState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";

import { submitFeedback } from "../feedback-actions";

const schema = z.object({
  rating: z.number().int().min(1, "Please select a rating").max(5),
  comment: z.string().trim().max(2000).optional(),
  isAnonymous: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

async function action(
  sessionId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return submitFeedback(formData);
}

export function FeedbackForm({
  sessionId,
  sessionTitle,
  coachName,
}: {
  sessionId: string;
  sessionTitle: string;
  coachName: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    action.bind(null, sessionId),
    null,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0, comment: "", isAnonymous: false },
  });

  const rating = form.watch("rating");

  useEffect(() => {
    if (state?.ok) {
      toast.success("Feedback submitted");
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("sessionId", sessionId);
    formData.set("rating", String(data.rating));
    formData.set("comment", data.comment ?? "");
    formData.set("isAnonymous", String(data.isAnonymous));
    formAction(formData);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">{sessionTitle}</h2>
        {coachName ? (
          <p className="text-sm text-zinc-500">Coach: {coachName}</p>
        ) : null}
      </div>

      <Field>
        <FieldLabel>How would you rate this session?</FieldLabel>
        <Controller
          control={form.control}
          name="rating"
          render={({ field }) => (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => field.onChange(n)}
                  className={`h-10 w-10 rounded-full border text-sm font-medium transition-colors ${
                    rating === n
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        />
        <FieldError errors={[form.formState.errors.rating]} />
      </Field>

      <Field>
        <FieldLabel>Comments (optional)</FieldLabel>
        <Textarea
          {...form.register("comment")}
          rows={4}
          placeholder="What worked well? What could be improved?"
        />
        <FieldError errors={[form.formState.errors.comment]} />
      </Field>

      <Field orientation="horizontal">
        <Controller
          control={form.control}
          name="isAnonymous"
          render={({ field }) => (
            <input
              type="checkbox"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-700"
            />
          )}
        />
        <FieldLabel>Submit anonymously</FieldLabel>
      </Field>
      <FieldDescription>
        Your name will not be shared with the coach or admin if checked.
      </FieldDescription>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting…" : "Submit feedback"}
      </Button>
    </form>
  );
}
