"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";

import { deleteCohort } from "../cohort-actions";
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

const deleteSchema = z.object({
  cohortId: z.string().min(1, "Cohort ID is required"),
});

type DeleteCohortFormValues = z.infer<typeof deleteSchema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return deleteCohort({
    cohortId: formData.get("cohortId"),
  });
}

interface DeleteCohortDialogProps {
  cohortId: string;
  cohortName: string;
  redirectOnSuccess?: boolean;
  trigger?: React.ReactElement;
}

export function DeleteCohortDialog({
  cohortId,
  cohortName,
  redirectOnSuccess = false,
  trigger,
}: DeleteCohortDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);
  const router = useRouter();

  const form = useForm<DeleteCohortFormValues>({
    resolver: zodResolver(deleteSchema),
    defaultValues: {
      cohortId,
    },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success(`Cohort "${cohortName}" has been deleted`);
      setOpen(false);
      if (redirectOnSuccess) {
        router.push("/cohorts");
      }
    }
    if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state, cohortName, redirectOnSuccess, router]);

  function onSubmit(data: DeleteCohortFormValues) {
    const formData = new FormData();
    formData.set("cohortId", data.cohortId);
    startTransition(() => {
      formAction(formData);
    });
  }

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="size-3.5" />
      Delete
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Delete Cohort
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span>
              Are you sure you want to delete cohort <strong>{cohortName}</strong>?
            </span>
            <span className="block text-xs text-muted-foreground">
              Scholars enrolled in this cohort will remain as active users in the system (unassigned). Cohort sessions, pathway steps, resources, and certificates associated with this intake will be permanently removed.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("cohortId")} />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" type="submit" disabled={isPending}>
              {isPending ? "Deleting…" : "Delete Cohort"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
