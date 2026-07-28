"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PlusIcon, CheckCircle2, AlertTriangle, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

import { createCoach } from "../coach-actions";
import { SPECIALTIES } from "../specialties";

const schema = z.object({
  name: z.string().trim().min(2, "Coach name is required").max(100),
  email: z.string().email("A valid email is required"),
  specialty: z.enum([
    "academic_writing",
    "leadership",
    "data_decisions",
    "one_on_one",
  ]),
  whatsappNumber: z
    .string()
    .trim()
    .min(7, "WhatsApp number is required (international format)")
    .max(30),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

type CreateCoachData = {
  tempPassword: string;
  emailSent: boolean;
  emailReason?: "resend_not_configured" | "send_failed";
};

async function action(
  _prev: ActionResult<CreateCoachData> | null,
  formData: FormData,
): Promise<ActionResult<CreateCoachData>> {
  return createCoach({
    name: formData.get("name"),
    email: formData.get("email"),
    specialty: formData.get("specialty"),
    whatsappNumber: formData.get("whatsappNumber"),
    bio: formData.get("bio"),
  });
}

export function CoachCreateForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);
  const [created, setCreated] = useState<{
    email: string;
    tempPassword: string;
    emailSent: boolean;
    emailReason?: "resend_not_configured" | "send_failed";
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      specialty: "one_on_one",
      whatsappNumber: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (state?.ok) {
      if (state.data.emailSent) {
        toast.success(`Coach added! Credentials email sent to ${form.getValues("email")}.`);
      } else {
        toast.success("Coach added! (Temporary password displayed below)");
      }
      setCreated({
        email: form.getValues("email"),
        tempPassword: state.data.tempPassword,
        emailSent: state.data.emailSent,
        emailReason: state.data.emailReason,
      });
      form.reset();
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, form]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("email", data.email);
    formData.set("specialty", data.specialty);
    formData.set("whatsappNumber", data.whatsappNumber);
    formData.set("bio", data.bio ?? "");
    startTransition(() => {
      formAction(formData);
    });
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setCreated(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon className="mr-1.5 size-4" />
            Add Coach
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a coach / expert</DialogTitle>
          <DialogDescription>
            Create a coach account and assign their domain specialty.
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="flex flex-col gap-4 py-2">
            {created.emailSent ? (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-50/50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Account Created & Email Sent
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  An email containing login instructions and temporary credentials has been sent to{" "}
                  <strong className="font-semibold">{created.email}</strong>.
                </p>
                <div className="pt-2 border-t border-emerald-500/20 text-xs flex items-center justify-between">
                  <span>Temporary password:</span>
                  <code className="font-mono font-semibold bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-950 dark:text-emerald-100">
                    {created.tempPassword}
                  </code>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-500/20 bg-amber-50/50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                  Account Created — Email Delivery {created.emailReason === "resend_not_configured" ? "Skipped (Dev Mode)" : "Failed"}
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {created.emailReason === "resend_not_configured"
                    ? `Resend API key is not configured in this environment, so no email was sent to ${created.email}.`
                    : `Email delivery to ${created.email} failed.`}{" "}
                  Please copy and share the temporary password with the coach manually:
                </p>
                <div className="pt-2 border-t border-amber-500/20 text-xs flex items-center justify-between">
                  <span>Temporary password:</span>
                  <code className="font-mono font-semibold bg-amber-100/70 dark:bg-amber-900/60 px-2 py-0.5 rounded text-amber-950 dark:text-amber-100">
                    {created.tempPassword}
                  </code>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 py-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input {...form.register("name")} placeholder="Dr. Jane Doe" />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input {...form.register("email")} type="email" placeholder="jane@example.com" />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Specialty</FieldLabel>
                <Controller
                  control={form.control}
                  name="specialty"
                  render={({ field }) => {
                    const specialtyItems = Object.entries(SPECIALTIES).map(
                      ([value, label]) => ({
                        value,
                        label,
                      })
                    );
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
                <Input {...form.register("whatsappNumber")} placeholder="+233…" />
                <FieldError errors={[form.formState.errors.whatsappNumber]} />
              </Field>
            </div>

            <Field>
              <FieldLabel>Bio (optional)</FieldLabel>
              <Textarea {...form.register("bio")} rows={3} placeholder="Brief background & coaching experience…" />
              <FieldError errors={[form.formState.errors.bio]} />
            </Field>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Adding…" : "Add coach"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
