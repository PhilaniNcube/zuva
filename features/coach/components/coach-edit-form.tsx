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

import { updateCoach } from "../coach-actions";
import { SPECIALTIES, type Specialty } from "../specialties";

const schema = z.object({
  specialty: z.enum([
    "academic_writing",
    "leadership",
    "data_decisions",
    "one_on_one",
  ]),
  whatsappNumber: z
    .string()
    .trim()
    .min(7, "WhatsApp number is required")
    .max(30),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

async function action(
  coachUserId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return updateCoach(coachUserId, {
    specialty: formData.get("specialty"),
    whatsappNumber: formData.get("whatsappNumber"),
    bio: formData.get("bio"),
  });
}

export function CoachEditForm({
  coachUserId,
  initial,
}: {
  coachUserId: string;
  initial: { specialty: Specialty; whatsappNumber: string; bio: string };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    action.bind(null, coachUserId),
    null,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Coach updated");
      setOpen(false);
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("specialty", data.specialty);
    formData.set("whatsappNumber", data.whatsappNumber);
    formData.set("bio", data.bio ?? "");
    formAction(formData);
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-w-72 flex-col gap-2">
      <Field>
        <FieldLabel>Specialty</FieldLabel>
        <Controller
          control={form.control}
          name="specialty"
          render={({ field }) => {
            const specialtyItems = Object.entries(SPECIALTIES).map(([value, label]) => ({
              value,
              label,
            }));
            return (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                items={specialtyItems}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {specialtyItems.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }}
        />
        <FieldError errors={[form.formState.errors.specialty]} />
      </Field>
      <Field>
        <FieldLabel>WhatsApp number</FieldLabel>
        <Input {...form.register("whatsappNumber")} />
        <FieldError errors={[form.formState.errors.whatsappNumber]} />
      </Field>
      <Field>
        <FieldLabel>Bio</FieldLabel>
        <Input {...form.register("bio")} placeholder="Bio (optional)" />
        <FieldError errors={[form.formState.errors.bio]} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
