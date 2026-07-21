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

import { advanceToApproval } from "../certificate-actions";

const schema = z.object({
  adminNote: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

async function action(
  certificateId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return advanceToApproval({
    certificateId,
    adminNote: formData.get("adminNote") || undefined,
  });
}

export function AdvanceForm({ certificateId }: { certificateId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    action.bind(null, certificateId),
    null,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { adminNote: "" },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Advanced to approval");
      setOpen(false);
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("adminNote", data.adminNote ?? "");
    formAction(formData);
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Advance to approval
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Field>
        <FieldLabel>Admin note (optional)</FieldLabel>
        <Input
          {...form.register("adminNote")}
          placeholder="e.g. Exceptional work, fast-tracked"
        />
        <FieldError errors={[form.formState.errors.adminNote]} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Advancing…" : "Confirm advance"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
