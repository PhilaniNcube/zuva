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

import {
  returnSubmission,
  startCriticalReview,
  startLanguageEditing,
} from "../submission-actions";

type CoachOption = { id: string; name: string };

// ---------------------------------------------------------------------------
// Start Review
// ---------------------------------------------------------------------------

const reviewSchema = z.object({
  reviewerId: z.string().min(1, "Select a reviewer"),
  dueAt: z.string().optional(),
});

type ReviewValues = z.infer<typeof reviewSchema>;

async function reviewAction(
  submissionId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return startCriticalReview({
    submissionId,
    reviewerId: formData.get("reviewerId"),
    dueAt: formData.get("dueAt") || undefined,
  });
}

export function StartReviewForm({
  submissionId,
  coaches,
  onDone,
}: {
  submissionId: string;
  coaches: CoachOption[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    reviewAction.bind(null, submissionId),
    null,
  );

  const form = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { reviewerId: "", dueAt: "" },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Review started");
      setOpen(false);
      onDone();
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, onDone]);

  function onSubmit(data: ReviewValues) {
    const formData = new FormData();
    formData.set("reviewerId", data.reviewerId);
    formData.set("dueAt", data.dueAt ?? "");
    formAction(formData);
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Start review
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Field>
        <FieldLabel>Reviewer</FieldLabel>
        <Controller
          control={form.control}
          name="reviewerId"
          render={({ field }) => {
            const coachItems = coaches.map((c) => ({ value: c.id, label: c.name }));
            return (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                items={coachItems}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reviewer" />
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
        <FieldError errors={[form.formState.errors.reviewerId]} />
      </Field>
      <Field>
        <FieldLabel>Due date</FieldLabel>
        <Input {...form.register("dueAt")} type="date" />
        <FieldError errors={[form.formState.errors.dueAt]} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Assign & start review"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Start Editing
// ---------------------------------------------------------------------------

const editingSchema = z.object({
  editorId: z.string().min(1, "Select an editor"),
  dueAt: z.string().optional(),
});

type EditingValues = z.infer<typeof editingSchema>;

async function editingAction(
  submissionId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return startLanguageEditing({
    submissionId,
    editorId: formData.get("editorId"),
    dueAt: formData.get("dueAt") || undefined,
  });
}

export function StartEditingForm({
  submissionId,
  coaches,
  onDone,
}: {
  submissionId: string;
  coaches: CoachOption[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    editingAction.bind(null, submissionId),
    null,
  );

  const form = useForm<EditingValues>({
    resolver: zodResolver(editingSchema),
    defaultValues: { editorId: "", dueAt: "" },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Editing started");
      setOpen(false);
      onDone();
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, onDone]);

  function onSubmit(data: EditingValues) {
    const formData = new FormData();
    formData.set("editorId", data.editorId);
    formData.set("dueAt", data.dueAt ?? "");
    formAction(formData);
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Start editing
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Field>
        <FieldLabel>Editor</FieldLabel>
        <Controller
          control={form.control}
          name="editorId"
          render={({ field }) => {
            const coachItems = coaches.map((c) => ({ value: c.id, label: c.name }));
            return (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                items={coachItems}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select editor" />
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
        <FieldError errors={[form.formState.errors.editorId]} />
      </Field>
      <Field>
        <FieldLabel>Due date</FieldLabel>
        <Input {...form.register("dueAt")} type="date" />
        <FieldError errors={[form.formState.errors.dueAt]} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Assign & start editing"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Return File
// ---------------------------------------------------------------------------

const returnSchema = z.object({
  file: z.any().refine((f) => f?.length > 0, "Select a file to return"),
});

type ReturnValues = z.infer<typeof returnSchema>;

async function returnAction(
  submissionId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return returnSubmission({
    submissionId,
    returnedFileKey: formData.get("fileKey") as string,
  });
}

export function ReturnFileForm({
  submissionId,
  onDone,
}: {
  submissionId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [state, formAction, isPending] = useActionState(
    returnAction.bind(null, submissionId),
    null,
  );

  const form = useForm<ReturnValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: { file: undefined },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("File returned to scholar");
      setOpen(false);
      onDone();
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, onDone]);

  async function onSubmit(data: ReturnValues) {
    const file = (data.file as FileList)?.[0];
    if (!file || file.size === 0) return;

    setUploading(true);

    const presignRes = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        purpose: "returned",
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
    formData.set("fileKey", key);
    formAction(formData);
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Return to scholar
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Field>
        <FieldLabel>Returned file</FieldLabel>
        <Input {...form.register("file")} type="file" />
        <FieldError errors={[form.formState.errors.file]} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || uploading}>
          {uploading ? "Uploading…" : isPending ? "Saving…" : "Return file"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
