"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
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

import { publishSlot } from "../session-actions";

const schema = z.object({
  startsAt: z.string().min(1, "Start time is required"),
  endsAt: z.string().min(1, "End time is required"),
});

type FormValues = z.infer<typeof schema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return publishSlot({
    startsAt: formData.get("startsAt") as string,
    endsAt: formData.get("endsAt") as string,
  });
}

export function SlotPublishForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { startsAt: "", endsAt: "" },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Slot published");
      form.reset();
      setOpen(false);
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, form]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("startsAt", new Date(data.startsAt).toISOString());
    formData.set("endsAt", new Date(data.endsAt).toISOString());
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon className="mr-1.5 size-4" />
            Publish Slot
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish a 1:1 slot</DialogTitle>
          <DialogDescription>
            Select the start and end time for scholars to book a 1:1 coaching session.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-2"
        >
          <Field>
            <FieldLabel>Start</FieldLabel>
            <Controller
              control={form.control}
              name="startsAt"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select start date & time"
                />
              )}
            />
            <FieldError errors={[form.formState.errors.startsAt]} />
          </Field>

          <Field>
            <FieldLabel>End</FieldLabel>
            <Controller
              control={form.control}
              name="endsAt"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select end date & time"
                />
              )}
            />
            <FieldError errors={[form.formState.errors.endsAt]} />
          </Field>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Publishing…" : "Publish slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
