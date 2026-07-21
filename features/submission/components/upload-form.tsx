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

import { createSubmission } from "../submission-actions";

const schema = z.object({
  title: z.string().trim().min(3, "Title is required").max(200),
  file: z.any().refine((f) => f?.length > 0, "Please select a file"),
});

type FormValues = z.infer<typeof schema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return createSubmission({
    title: formData.get("title"),
    fileKey: formData.get("fileKey"),
  });
}

export function SubmissionUploadForm() {
  const [state, formAction, isPending] = useActionState(action, null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", file: undefined },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Submission uploaded");
      form.reset();
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, form]);

  async function onSubmit(data: FormValues) {
    const file = (data.file as FileList)?.[0];
    if (!file || file.size === 0) return;

    setUploading(true);

    // 1. Get presigned URL
    const presignRes = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        purpose: "submission",
      }),
    });
    if (!presignRes.ok) {
      const msg = (await presignRes.json()).error ?? "Failed to get upload URL";
      toast.error(msg);
      setUploading(false);
      return;
    }
    const { uploadUrl, key } = await presignRes.json();

    // 2. Upload file directly to R2
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });
    if (!putRes.ok) {
      toast.error("Upload to storage failed. Please try again.");
      setUploading(false);
      return;
    }
    setUploading(false);

    // 3. Create submission record via server action
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("fileKey", key);
    formAction(formData);
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <Field className="flex-1">
        <FieldLabel>Title</FieldLabel>
        <Input
          {...form.register("title")}
          placeholder="e.g. Draft Chapter 2 — Literature Review"
        />
        <FieldError errors={[form.formState.errors.title]} />
      </Field>
      <Field>
        <FieldLabel>File</FieldLabel>
        <Input {...form.register("file")} type="file" />
        <FieldError errors={[form.formState.errors.file]} />
      </Field>
      <Button type="submit" disabled={isPending || uploading}>
        {uploading ? "Uploading…" : isPending ? "Saving…" : "Submit for editing"}
      </Button>
    </form>
  );
}
