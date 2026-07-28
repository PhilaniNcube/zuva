"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";

import { unenrollScholar } from "../cohort-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/action-result";

const unenrollSchema = z.object({
  scholarId: z.string().min(1, "Scholar ID is required"),
  cohortId: z.string().min(1, "Cohort ID is required"),
});

type UnenrollFormValues = z.infer<typeof unenrollSchema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return unenrollScholar({
    scholarId: formData.get("scholarId"),
    cohortId: formData.get("cohortId"),
  });
}

interface UnenrollScholarDialogProps {
  scholarId: string;
  scholarName: string;
  cohortId: string;
}

export function UnenrollScholarDialog({
  scholarId,
  scholarName,
  cohortId,
}: UnenrollScholarDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);

  const form = useForm<UnenrollFormValues>({
    resolver: zodResolver(unenrollSchema),
    defaultValues: {
      scholarId,
      cohortId,
    },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success(`${scholarName} was removed from this cohort`);
      setOpen(false);
    }
    if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state, scholarName]);

  function onSubmit(data: UnenrollFormValues) {
    const formData = new FormData();
    formData.set("scholarId", data.scholarId);
    formData.set("cohortId", data.cohortId);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <UserMinus className="size-3.5" />
            Unenroll
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="size-5 text-amber-500" />
            Remove Scholar from Cohort
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{scholarName}</strong> from this cohort? Their user account will remain active, but they will no longer be assigned to this intake.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("scholarId")} />
          <input type="hidden" {...form.register("cohortId")} />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Removing…" : "Remove from Cohort"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
