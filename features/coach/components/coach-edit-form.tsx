"use client";

import { startTransition, useActionState, useEffect, useState, type ReactElement } from "react";
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

import { updateCoach } from "../coach-actions";
import { SPECIALTIES, type Specialty } from "../specialties";

const schema = z.object({
  name: z.string().trim().min(2, "Coach name is required").max(100),
  specialty: z.enum([
    "academic_writing",
    "leadership",
    "data_decisions",
    "one_on_one",
  ]),
  whatsappNumber: z
    .string()
    .trim()
    .min(7, "WhatsApp number is required")
    .max(30),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  icalUrl: z
    .string()
    .trim()
    .url("Must be a valid URL (https://... or http://...)")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

async function action(
  coachUserId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return updateCoach(coachUserId, {
    name: formData.get("name"),
    specialty: formData.get("specialty"),
    whatsappNumber: formData.get("whatsappNumber"),
    bio: formData.get("bio"),
    icalUrl: formData.get("icalUrl"),
  });
}

export function CoachEditForm({
  coachUserId,
  initial,
  trigger,
}: {
  coachUserId: string;
  initial: {
    name: string;
    specialty: Specialty;
    whatsappNumber: string;
    bio: string;
    icalUrl?: string | null;
  };
  trigger?: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    action.bind(null, coachUserId),
    null,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...initial,
      icalUrl: initial.icalUrl ?? "",
    },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Coach updated");
      setOpen(false);
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("specialty", data.specialty);
    formData.set("whatsappNumber", data.whatsappNumber);
    formData.set("bio", data.bio ?? "");
    formData.set("icalUrl", data.icalUrl ?? "");
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline" size="sm">
              Edit
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Coach Profile</DialogTitle>
          <DialogDescription>
            Update coach information, specialty preferences, and calendar feed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 py-2">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input {...form.register("name")} />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel>Specialty</FieldLabel>
            <Controller
              control={form.control}
              name="specialty"
              render={({ field }) => {
                const specialtyItems = Object.entries(SPECIALTIES).map(([value, label]) => ({
                  value,
                  label,
                }));
                return (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={specialtyItems}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {specialtyItems.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
            <FieldError errors={[form.formState.errors.specialty]} />
          </Field>
          <Field>
            <FieldLabel>WhatsApp number</FieldLabel>
            <Input {...form.register("whatsappNumber")} />
            <FieldError errors={[form.formState.errors.whatsappNumber]} />
          </Field>
          <Field>
            <FieldLabel>Bio</FieldLabel>
            <Input {...form.register("bio")} placeholder="Bio (optional)" />
            <FieldError errors={[form.formState.errors.bio]} />
          </Field>
          <Field>
            <FieldLabel>iCal Feed URL (.ics)</FieldLabel>
            <Input
              {...form.register("icalUrl")}
              placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
            />
            <FieldError errors={[form.formState.errors.icalUrl]} />
          </Field>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


