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

import { createCoach } from "../coach-actions";
import { SPECIALTIES } from "../specialties";

const schema = z.object({
  name: z.string().trim().min(2, "Coach name is required").max(100),
  email: z.string().email("A valid email is required"),
  specialty: z.enum([
    "academic_writing",
    "leadership",
    "data_decisions",
    "one_on_one",
  ]),
  whatsappNumber: z
    .string()
    .trim()
    .min(7, "WhatsApp number is required (international format)")
    .max(30),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

async function action(
  _prev: ActionResult<{ tempPassword: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ tempPassword: string }>> {
  return createCoach({
    name: formData.get("name"),
    email: formData.get("email"),
    specialty: formData.get("specialty"),
    whatsappNumber: formData.get("whatsappNumber"),
    bio: formData.get("bio"),
  });
}

export function CoachCreateForm() {
  const [state, formAction, isPending] = useActionState(action, null);
  const [created, setCreated] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      specialty: "one_on_one",
      whatsappNumber: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Coach added");
      setCreated({
        email: form.getValues("email"),
        tempPassword: state.data.tempPassword,
      });
      form.reset();
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, form]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("email", data.email);
    formData.set("specialty", data.specialty);
    formData.set("whatsappNumber", data.whatsappNumber);
    formData.set("bio", data.bio ?? "");
    formAction(formData);
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="mb-3 text-sm font-semibold">Add a coach / expert</h3>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-wrap items-end gap-3"
      >
        <Field className="flex-1">
          <FieldLabel>Name</FieldLabel>
          <Input {...form.register("name")} />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>
        <Field className="flex-1">
          <FieldLabel>Email</FieldLabel>
          <Input {...form.register("email")} type="email" />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>
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
          <Input {...form.register("whatsappNumber")} placeholder="+233…" />
          <FieldError errors={[form.formState.errors.whatsappNumber]} />
        </Field>
        <Field className="flex-1">
          <FieldLabel>Bio (optional)</FieldLabel>
          <Input {...form.register("bio")} />
          <FieldError errors={[form.formState.errors.bio]} />
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding…" : "Add coach"}
        </Button>
      </form>
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
