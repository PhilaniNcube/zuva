"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";

import { deleteUser } from "../user-actions";
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

const deleteUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

type DeleteUserFormValues = z.infer<typeof deleteUserSchema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return deleteUser({
    userId: formData.get("userId"),
  });
}

interface DeleteUserDialogProps {
  userId: string;
  userName: string;
  userEmail?: string;
  disabled?: boolean;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteUserDialog({
  userId,
  userName,
  userEmail,
  disabled = false,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: DeleteUserDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? controlledOnOpenChange ?? (() => {}) : setUncontrolledOpen;

  const [state, formAction, isPending] = useActionState(action, null);

  const form = useForm<DeleteUserFormValues>({
    resolver: zodResolver(deleteUserSchema),
    values: {
      userId,
    },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success(`User "${userName}" has been deleted`);
      setOpen(false);
    }
    if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state, userName]);

  function onSubmit(data: DeleteUserFormValues) {
    const formData = new FormData();
    formData.set("userId", data.userId);
    startTransition(() => {
      formAction(formData);
    });
  }

  if (disabled) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-xs opacity-50"
        disabled
      >
        <Trash2 className="size-3.5" />
        Delete
      </Button>
    );
  }

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="size-3.5" />
      Delete
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled || trigger ? (
        <DialogTrigger render={trigger ?? defaultTrigger} />
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Delete User Account
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span>
              Are you sure you want to permanently delete <strong>{userName}</strong>
              {userEmail ? ` (${userEmail})` : ""}?
            </span>
            <span className="block text-xs text-muted-foreground">
              This action cannot be undone. All profile data, session bookings, submissions, and records for this user will be removed.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("userId")} />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" type="submit" disabled={isPending}>
              {isPending ? "Deleting…" : "Delete Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
