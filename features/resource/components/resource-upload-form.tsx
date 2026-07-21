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

import { createResource } from "../resource-actions";

const schema = z.object({
  title: z.string().trim().min(3, "Title is required").max(200),
  cohortId: z.string().optional(),
  file: z.any().refine((f) => f?.length > 0, "Please select a file"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return createResource({
    title: formData.get("title"),
    description: formData.get("description"),
    fileKey: formData.get("fileKey"),
    cohortId: formData.get("cohortId") || null,
  });
}

export function ResourceUploadForm({
  cohorts,
}: {
  cohorts: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", cohortId: "", file: undefined, description: "" },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Resource added");
      form.reset();
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, form]);

  async function onSubmit(data: FormValues) {
    const file = (data.file as FileList)?.[0];
    if (!file || file.size === 0) return;

    setUploading(true);

    const presignRes = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        purpose: "resource",
      }),
    });
    if (!presignRes.ok) {
      const msg = (await presignRes.json()).error ?? "Failed to get upload URL";
      toast.error(msg);
      setUploading(false);
      return;
    }
    const { uploadUrl, key } = await presignRes.json();
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });
    if (!putRes.ok) {
      toast.error("Upload failed.");
      setUploading(false);
      return;
    }
    setUploading(false);

    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("description", data.description ?? "");
    formData.set("fileKey", key);
    formData.set("cohortId", data.cohortId ?? "");
    formAction(formData);
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <Field className="flex-1">
        <FieldLabel>Title</FieldLabel>
        <Input {...form.register("title")} />
        <FieldError errors={[form.formState.errors.title]} />
      </Field>
      <Field>
        <FieldLabel>Cohort (optional)</FieldLabel>
        <Controller
          control={form.control}
          name="cohortId"
          render={({ field }) => {
            const cohortItems = [
              { value: "", label: "All cohorts" },
              ...cohorts.map((c) => ({ value: c.id, label: c.name })),
            ];
            return (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                items={cohortItems}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All cohorts" />
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
        <FieldLabel>File</FieldLabel>
        <Input {...form.register("file")} type="file" />
        <FieldError errors={[form.formState.errors.file]} />
      </Field>
      <Field className="flex-1">
        <FieldLabel>Description (optional)</FieldLabel>
        <Input {...form.register("description")} />
        <FieldError errors={[form.formState.errors.description]} />
      </Field>
      <Button type="submit" disabled={isPending || uploading}>
        {uploading ? "Uploading…" : isPending ? "Saving…" : "Add resource"}
      </Button>
    </form>
  );
}
