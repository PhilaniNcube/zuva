"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { createOnboardingSession } from "../session-actions";

const schema = z
  .object({
    scholarId: z.string().min(1, "Scholar is required"),
    hostId: z.string().min(1, "Host is required"),
    startsAt: z.string().min(1, "Start time is required"),
    endsAt: z.string().min(1, "End time is required"),
  })
  .refine(
    (data) => {
      if (!data.startsAt) return true;
      return new Date(data.startsAt) > new Date();
    },
    {
      message: "Start time cannot be in the past",
      path: ["startsAt"],
    }
  )
  .refine(
    (data) => {
      if (!data.startsAt || !data.endsAt) return true;
      return new Date(data.endsAt) >= new Date(data.startsAt);
    },
    {
      message: "End time cannot be before start time",
      path: ["endsAt"],
    }
  );

type FormValues = z.infer<typeof schema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return createOnboardingSession({
    scholarId: formData.get("scholarId"),
    hostId: formData.get("hostId"),
    startsAt: formData.get("startsAt") as string,
    endsAt: formData.get("endsAt") as string,
  });
}

export function OnboardingSessionForm({
  scholars,
  hosts,
}: {
  scholars: { id: string; name: string; cohortName: string }[];
  hosts: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      scholarId: "",
      hostId: hosts[0]?.id ?? "",
      startsAt: "",
      endsAt: "",
    },
  });

  const startsAtValue = form.watch("startsAt");
  const now = new Date();

  useEffect(() => {
    if (state?.ok) {
      toast.success("Onboarding session scheduled");
      form.reset();
      setOpen(false);
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, form]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("scholarId", data.scholarId);
    formData.set("hostId", data.hostId);
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
          <Button variant="outline">
            <UserPlusIcon className="mr-1.5 size-4" />
            Schedule Onboarding
          </Button>
        }
      />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Schedule an onboarding 1:1</DialogTitle>
          <DialogDescription>
            Book a one-on-one onboarding call between a scholar and a programme
            team member.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Scholar</FieldLabel>
              <Controller
                control={form.control}
                name="scholarId"
                render={({ field }) => {
                  const scholarItems = scholars.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.cohortName})`,
                  }));
                  return (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={scholarItems}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pick a scholar" />
                      </SelectTrigger>
                      <SelectContent>
                        {scholarItems.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              <FieldError errors={[form.formState.errors.scholarId]} />
            </Field>
            <Field>
              <FieldLabel>Host</FieldLabel>
              <Controller
                control={form.control}
                name="hostId"
                render={({ field }) => {
                  const hostItems = hosts.map((h) => ({
                    value: h.id,
                    label: h.name,
                  }));
                  return (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={hostItems}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hostItems.map((h) => (
                          <SelectItem key={h.value} value={h.value}>
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              <FieldError errors={[form.formState.errors.hostId]} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Start</FieldLabel>
              <Controller
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    minDate={now}
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
                    minDate={startsAtValue ? new Date(startsAtValue) : now}
                    placeholder="Select end date & time"
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.endsAt]} />
            </Field>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Scheduling…" : "Schedule onboarding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
