"use client";

import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/action-result";

import { enrollScholar } from "../cohort-actions";

const schema = z.object({
  name: z.string().trim().min(2, "Scholar name is required").max(100),
  email: z.string().email("A valid email is required"),
  country: z.string().trim().max(100).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

async function action(
  cohortId: string,
  _prev: ActionResult<{ tempPassword: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ tempPassword: string }>> {
  return enrollScholar({
    cohortId,
    name: formData.get("name"),
    email: formData.get("email"),
    country: formData.get("country"),
  });
}

export function ScholarEnrollForm({ cohortId }: { cohortId: string }) {
  const [state, formAction, isPending] = useActionState(
    action.bind(null, cohortId),
    null,
  );
  const [enrolled, setEnrolled] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", country: "" },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Scholar enrolled");
      setEnrolled({
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
    formData.set("country", data.country ?? "");
    formAction(formData);
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="mb-3 text-sm font-semibold">Enrol a new scholar</h3>
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
          <FieldLabel>Country (optional)</FieldLabel>
          <Input {...form.register("country")} />
          <FieldError errors={[form.formState.errors.country]} />
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enrolling…" : "Enrol scholar"}
        </Button>
      </form>
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
