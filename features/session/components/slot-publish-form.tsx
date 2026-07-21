"use client";

import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/action-result";

import { publishSlot } from "../session-actions";

const schema = z.object({
  startsAt: z.string().min(1, "Start time is required"),
  endsAt: z.string().min(1, "End time is required"),
});

type FormValues = z.infer<typeof schema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return publishSlot({
    startsAt: formData.get("startsAt") as string,
    endsAt: formData.get("endsAt") as string,
  });
}

export function SlotPublishForm() {
  const [state, formAction, isPending] = useActionState(action, null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { startsAt: "", endsAt: "" },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Slot published");
      form.reset();
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, form]);

  function onSubmit(data: FormValues) {
    // datetime-local values are in the browser's timezone — convert to UTC ISO.
    const formData = new FormData();
    formData.set("startsAt", new Date(data.startsAt).toISOString());
    formData.set("endsAt", new Date(data.endsAt).toISOString());
    formAction(formData);
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <Field>
        <FieldLabel>Start</FieldLabel>
        <Input {...form.register("startsAt")} type="datetime-local" />
        <FieldError errors={[form.formState.errors.startsAt]} />
      </Field>
      <Field>
        <FieldLabel>End</FieldLabel>
        <Input {...form.register("endsAt")} type="datetime-local" />
        <FieldError errors={[form.formState.errors.endsAt]} />
      </Field>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Publishing…" : "Publish slot"}
      </Button>
    </form>
  );
}
