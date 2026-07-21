"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { createCohort } from "../cohort-actions";

const schema = z
  .object({
    name: z.string().trim().min(3, "Cohort name is required").max(100),
    startsAt: z.string().min(1, "Start date is required"),
    endsAt: z.string().optional().or(z.literal("")),
    status: z.enum(["draft", "active", "completed"]),
  })
  .refine(
    (data) => {
      if (!data.startsAt) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(data.startsAt) >= today;
    },
    {
      message: "Start date cannot be in the past",
      path: ["startsAt"],
    }
  )
  .refine(
    (data) => {
      if (!data.startsAt || !data.endsAt) return true;
      return new Date(data.endsAt) >= new Date(data.startsAt);
    },
    {
      message: "End date cannot be before start date",
      path: ["endsAt"],
    }
  );

type FormValues = z.infer<typeof schema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return createCohort({
    name: formData.get("name"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    status: formData.get("status"),
  });
}

export function CohortCreateForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", startsAt: "", endsAt: "", status: "draft" },
  });

  const startsAtValue = form.watch("startsAt");

  useEffect(() => {
    if (state?.ok) {
      toast.success("Cohort created");
      form.reset();
      setOpen(false);
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, form]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("startsAt", data.startsAt);
    formData.set("endsAt", data.endsAt ?? "");
    formData.set("status", data.status);
    startTransition(() => {
      formAction(formData);
    });
  }

  const now = new Date();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon className="mr-1.5 size-4" />
            Create Cohort
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new cohort</DialogTitle>
          <DialogDescription>
            Add a new cohort intake to track scholars and coaching sessions.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-2"
        >
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input {...form.register("name")} placeholder="2026 Intake 2" />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Starts</FieldLabel>
              <Controller
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    showTime={false}
                    minDate={now}
                    placeholder="Select start date"
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.startsAt]} />
            </Field>
            <Field>
              <FieldLabel>Ends (optional)</FieldLabel>
              <Controller
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    showTime={false}
                    minDate={startsAtValue ? new Date(startsAtValue) : now}
                    placeholder="Select end date"
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.endsAt]} />
            </Field>
          </div>

          <Field>
            <FieldLabel>Status</FieldLabel>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => {
                const statusItems = [
                  { value: "draft", label: "Draft" },
                  { value: "active", label: "Active" },
                  { value: "completed", label: "Completed" },
                ];
                return (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={statusItems}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
            <FieldError errors={[form.formState.errors.status]} />
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
              {isPending ? "Creating…" : "Create cohort"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
