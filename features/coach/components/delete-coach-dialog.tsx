"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";

import { deleteCoach } from "../coach-actions";
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

const deleteCoachFormSchema = z.object({
  coachUserId: z.string().min(1, "Coach User ID is required"),
});

type DeleteCoachFormValues = z.infer<typeof deleteCoachFormSchema>;

interface DeleteCoachDialogProps {
  coachUserId: string;
  coachName: string;
  coachEmail?: string;
  redirectOnSuccess?: boolean;
  trigger?: React.ReactElement;
}

export function DeleteCoachDialog({
  coachUserId,
  coachName,
  coachEmail,
  redirectOnSuccess = false,
  trigger,
}: DeleteCoachDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<DeleteCoachFormValues>({
    resolver: zodResolver(deleteCoachFormSchema),
    defaultValues: {
      coachUserId,
    },
  });

  function onSubmit(data: DeleteCoachFormValues) {
    startTransition(async () => {
      const res = await deleteCoach({ coachUserId: data.coachUserId });
      if (res.ok) {
        toast.success(`Coach "${coachName}" has been deleted`);
        setOpen(false);
        if (redirectOnSuccess) {
          router.push("/coaches");
        }
      } else {
        toast.error(res.error);
      }
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
            Delete Coach Account
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span>
              Are you sure you want to permanently delete <strong>{coachName}</strong>
              {coachEmail ? ` (${coachEmail})` : ""}?
            </span>
            <span className="block text-xs text-muted-foreground">
              This action cannot be undone. The coach&apos;s profile, availability slots, and 1:1 bookings will be removed. Scheduled group sessions and assigned manuscript reviews will become unassigned. Past scholar attendance and feedback logs will be preserved.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("coachUserId")} />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" type="submit" disabled={isPending}>
              {isPending ? "Deleting…" : "Delete Coach"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
