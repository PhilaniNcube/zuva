"use client";

import { useActionState, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/lib/action-result";

import { updateCohort } from "../cohort-actions";

const schema = z.object({
  name: z.string().trim().min(3, "Cohort name is required").max(100),
  startsAt: z.string().min(1, "Start date is required"),
  endsAt: z.string().optional(),
  status: z.enum(["draft", "active", "completed"]),
});

type FormValues = z.infer<typeof schema>;

async function action(
  cohortId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return updateCohort(cohortId, {
    name: formData.get("name"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    status: formData.get("status"),
  });
}

export function CohortEditForm({
  cohortId,
  initial,
}: {
  cohortId: string;
  initial: FormValues;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    action.bind(null, cohortId),
    null,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Cohort updated");
      setOpen(false);
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("startsAt", data.startsAt);
    formData.set("endsAt", data.endsAt ?? "");
    formData.set("status", data.status);
    formAction(formData);
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Edit cohort
      </Button>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <Field className="flex-1">
        <FieldLabel>Name</FieldLabel>
        <Input {...form.register("name")} />
        <FieldError errors={[form.formState.errors.name]} />
      </Field>
      <Field>
        <FieldLabel>Starts</FieldLabel>
        <Input {...form.register("startsAt")} type="date" />
        <FieldError errors={[form.formState.errors.startsAt]} />
      </Field>
      <Field>
        <FieldLabel>Ends</FieldLabel>
        <Input {...form.register("endsAt")} type="date" />
        <FieldError errors={[form.formState.errors.endsAt]} />
      </Field>
      <Field>
        <FieldLabel>Status</FieldLabel>
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => {
            const statusItems = [
              { value: "draft", label: "Draft" },
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
            ];
            return (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                items={statusItems}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }}
        />
        <FieldError errors={[form.formState.errors.status]} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
