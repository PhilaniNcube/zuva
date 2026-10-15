"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";

import { publishSessionRecording } from "../resource-actions";

const schema = z.object({
  title: z.string().trim().max(150).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  file: z.any().optional(),
});

type FormValues = z.infer<typeof schema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return publishSessionRecording({
    sessionId: formData.get("sessionId"),
    fileKey: formData.get("fileKey"),
    title: formData.get("title"),
    description: formData.get("description"),
  });
}

export function UploadRecordingForm({ sessionId }: { sessionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", file: undefined },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Recording published and scholars notified");
      form.reset();
      setIsOpen(false);
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, form]);

  async function onSubmit(data: FormValues) {
    const fileList = data.file as FileList | undefined;
    const file = fileList?.[0];
    if (!file || file.size === 0) {
      toast.error("Please select a recording file to upload");
      return;
    }

    setUploading(true);
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "video/webm",
          purpose: "recording",
        }),
      });

      if (!presignRes.ok) {
        const msg = (await presignRes.json()).error ?? "Failed to get upload URL";
        toast.error(msg);
        return;
      }

      const { uploadUrl, key } = await presignRes.json();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "video/webm" },
      });

      if (!putRes.ok) {
        toast.error("Recording upload failed.");
        return;
      }

      const formData = new FormData();
      formData.set("sessionId", sessionId);
      formData.set("fileKey", key);
      formData.set("title", data.title ?? "");
      formData.set("description", data.description ?? "");

      startTransition(() => {
        formAction(formData);
      });
    } finally {
      setUploading(false);
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 text-xs"
      >
        <Plus className="size-4" />
        Upload Recording
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Upload Session Recording
          </h3>
          <p className="text-xs text-muted-foreground">
            The video is stored in R2 and the cohort is emailed once the session
            has ended.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="text-xs text-muted-foreground"
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Field>
          <FieldLabel>Recording file (MP4, WebM, etc.)</FieldLabel>
          <Input {...form.register("file")} type="file" accept="video/*" />
          <FieldError errors={[form.formState.errors.file]} />
        </Field>

        <Field>
          <FieldLabel>Title (optional)</FieldLabel>
          <Input
            {...form.register("title")}
            placeholder="Defaults to “<session title> — recording”"
          />
          <FieldError errors={[form.formState.errors.title]} />
        </Field>

        <Field>
          <FieldLabel>Description (optional)</FieldLabel>
          <Textarea
            {...form.register("description")}
            rows={2}
            placeholder="Notes for scholars watching the replay…"
          />
          <FieldError errors={[form.formState.errors.description]} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isPending || uploading}>
            <UploadCloud className="size-4" />
            {uploading ? "Uploading…" : isPending ? "Publishing…" : "Publish Recording"}
          </Button>
        </div>
      </form>
    </div>
  );
}
