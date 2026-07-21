"use client";

import { useActionState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/lib/action-result";

import { createCohortSession } from "../session-actions";

const schema = z.object({
  cohortId: z.string().min(1, "Cohort is required"),
  type: z.enum(["masterclass", "orientation"]),
  coachId: z.string().optional(),
  title: z.string().trim().min(3, "Title is required").max(200),
  startsAt: z.string().min(1, "Start time is required"),
  endsAt: z.string().min(1, "End time is required"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return createCohortSession({
    cohortId: formData.get("cohortId"),
    type: formData.get("type"),
    coachId: formData.get("coachId") || null,
    title: formData.get("title"),
    description: formData.get("description"),
    startsAt: formData.get("startsAt") as string,
    endsAt: formData.get("endsAt") as string,
  });
}

export function CohortSessionForm({
  cohorts,
  coaches,
}: {
  cohorts: { id: string; name: string }[];
  coaches: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(action, null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cohortId: cohorts[0]?.id ?? "",
      type: "masterclass",
      coachId: "",
      title: "",
      startsAt: "",
      endsAt: "",
      description: "",
    },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Session scheduled");
      form.reset();
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, form]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("cohortId", data.cohortId);
    formData.set("type", data.type);
    formData.set("coachId", data.coachId ?? "");
    formData.set("title", data.title);
    formData.set("startsAt", new Date(data.startsAt).toISOString());
    formData.set("endsAt", new Date(data.endsAt).toISOString());
    formData.set("description", data.description ?? "");
    formAction(formData);
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h3 className="text-sm font-semibold">Schedule a group session</h3>
      <div className="flex flex-wrap items-end gap-3">
        <Field>
          <FieldLabel>Cohort</FieldLabel>
          <Controller
            control={form.control}
            name="cohortId"
            render={({ field }) => {
              const cohortItems = cohorts.map((c) => ({ value: c.id, label: c.name }));
              return (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={cohortItems}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cohortItems.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
          <FieldError errors={[form.formState.errors.cohortId]} />
        </Field>
        <Field>
          <FieldLabel>Type</FieldLabel>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => {
              const typeItems = [
                { value: "masterclass", label: "Masterclass" },
                { value: "orientation", label: "Orientation" },
              ];
              return (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={typeItems}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeItems.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
          <FieldError errors={[form.formState.errors.type]} />
        </Field>
        <Field>
          <FieldLabel>Coach (optional)</FieldLabel>
          <Controller
            control={form.control}
            name="coachId"
            render={({ field }) => {
              const coachItems = [
                { value: "", label: "—" },
                ...coaches.map((c) => ({ value: c.id, label: c.name })),
              ];
              return (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={coachItems}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {coachItems.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
          <FieldError errors={[form.formState.errors.coachId]} />
        </Field>
        <Field className="flex-1">
          <FieldLabel>Title</FieldLabel>
          <Input
            {...form.register("title")}
            placeholder="Academic Writing Masterclass II"
          />
          <FieldError errors={[form.formState.errors.title]} />
        </Field>
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
      </div>
      <Field>
        <FieldLabel>Description (optional)</FieldLabel>
        <Textarea {...form.register("description")} rows={2} />
        <FieldError errors={[form.formState.errors.description]} />
      </Field>
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Scheduling…" : "Schedule session"}
        </Button>
      </div>
    </form>
  );
}
