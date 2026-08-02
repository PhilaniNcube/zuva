"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { FileText, Link as LinkIcon, Plus, Video, UploadCloud, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action-result";

import { createResource } from "../resource-actions";

const schema = z.object({
  title: z.string().trim().min(3, "Title is required").max(150),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  type: z.enum(["document", "video", "link"]),
  mode: z.enum(["file", "url"]),
  file: z.any().optional(),
  url: z.string().trim().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return createResource({
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    fileKey: formData.get("fileKey"),
    url: formData.get("url"),
    sessionId: formData.get("sessionId"),
    cohortId: formData.get("cohortId"),
  });
}

export function AddSessionResourceForm({
  sessionId,
  cohortId,
}: {
  sessionId: string;
  cohortId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      type: "document",
      mode: "file",
      file: undefined,
      url: "",
    },
  });

  const watchType = form.watch("type");
  const watchMode = form.watch("mode");

  useEffect(() => {
    if (state?.ok) {
      toast.success("Pre-session resource added successfully");
      form.reset();
      setIsOpen(false);
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, form]);

  async function onSubmit(data: FormValues) {
    let key = "";
    if (data.mode === "file") {
      const fileList = data.file as FileList | undefined;
      const file = fileList?.[0];
      if (!file || file.size === 0) {
        toast.error("Please select a file to upload");
        return;
      }

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

      const { uploadUrl, key: generatedKey } = await presignRes.json();
      key = generatedKey;

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      if (!putRes.ok) {
        toast.error("File upload failed.");
        setUploading(false);
        return;
      }

      setUploading(false);
    } else {
      if (!data.url || data.url.trim().length === 0) {
        toast.error("Please provide a valid URL");
        return;
      }
    }

    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("description", data.description ?? "");
    formData.set("type", data.type);
    formData.set("fileKey", key);
    formData.set("url", data.mode === "url" ? data.url ?? "" : "");
    formData.set("sessionId", sessionId);
    if (cohortId) formData.set("cohortId", cohortId);

    startTransition(() => {
      formAction(formData);
    });
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
        Add Pre-Session Resource
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Add Pre-Session Material</h3>
          <p className="text-xs text-muted-foreground">
            Attach reading materials or video links scholars should review before joining.
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
          <FieldLabel>Title</FieldLabel>
          <Input
            {...form.register("title")}
            placeholder="e.g. Mandatory Pre-Session Reading: Literature Review Protocol"
          />
          <FieldError errors={[form.formState.errors.title]} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Resource Category</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => form.setValue("type", "document")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  watchType === "document"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <FileText className="size-4 mb-1" />
                Document
              </button>
              <button
                type="button"
                onClick={() => form.setValue("type", "video")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  watchType === "video"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <Video className="size-4 mb-1" />
                Video
              </button>
              <button
                type="button"
                onClick={() => form.setValue("type", "link")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  watchType === "link"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <LinkIcon className="size-4 mb-1" />
                Web Link
              </button>
            </div>
          </Field>

          <Field>
            <FieldLabel>Storage Method</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => form.setValue("mode", "file")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  watchMode === "file"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <UploadCloud className="size-4" />
                Upload File (R2)
              </button>
              <button
                type="button"
                onClick={() => form.setValue("mode", "url")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  watchMode === "url"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <Link2 className="size-4" />
                External URL
              </button>
            </div>
          </Field>
        </div>

        {watchMode === "file" ? (
          <Field>
            <FieldLabel>Select File (PDF, DOCX, MP4, etc.)</FieldLabel>
            <Input {...form.register("file")} type="file" />
            <FieldError errors={[form.formState.errors.file]} />
          </Field>
        ) : (
          <Field>
            <FieldLabel>Link URL (YouTube, Loom, Vimeo, Google Drive, etc.)</FieldLabel>
            <Input
              {...form.register("url")}
              placeholder="https://youtu.be/... or https://loom.com/share/..."
            />
            <FieldError errors={[form.formState.errors.url]} />
          </Field>
        )}

        <Field>
          <FieldLabel>Description / Instructions (optional)</FieldLabel>
          <Textarea
            {...form.register("description")}
            placeholder="Brief instructions on what scholars should focus on..."
            rows={2}
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
            {uploading ? "Uploading file..." : isPending ? "Saving..." : "Publish Resource"}
          </Button>
        </div>
      </form>
    </div>
  );
}
