"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PlusIcon, Mail, CheckCircle2, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

import { enrollScholar } from "../cohort-actions";

const schema = z.object({
  name: z.string().trim().min(2, "Scholar name is required").max(100),
  email: z.string().email("A valid email is required"),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  whatsappNumber: z.string().trim().max(30).optional().or(z.literal("")),
  degree: z.string().trim().max(150).optional().or(z.literal("")),
  institution: z.string().trim().max(150).optional().or(z.literal("")),
  sendEmail: z.boolean(),
  markOnboardingCompleted: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

async function action(
  cohortId: string,
  _prev: ActionResult<{ tempPassword: string; emailSent: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ tempPassword: string; emailSent: boolean }>> {
  return enrollScholar({
    cohortId,
    name: formData.get("name"),
    email: formData.get("email"),
    country: formData.get("country"),
    whatsappNumber: formData.get("whatsappNumber"),
    degree: formData.get("degree"),
    institution: formData.get("institution"),
    sendEmail: formData.get("sendEmail") === "true",
    markOnboardingCompleted: formData.get("markOnboardingCompleted") === "true",
  });
}

interface ScholarEnrollFormProps {
  cohortId: string;
  cohortStatus?: string;
  isHistorical?: boolean;
}

export function ScholarEnrollForm({
  cohortId,
  cohortStatus,
  isHistorical = false,
}: ScholarEnrollFormProps) {
  const isPast = isHistorical || cohortStatus === "completed";
  const [open, setOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(!isPast);
  const [markOnboardingCompleted, setMarkOnboardingCompleted] = useState(isPast);

  const [state, formAction, isPending] = useActionState(
    action.bind(null, cohortId),
    null,
  );
  const [enrolled, setEnrolled] = useState<{
    email: string;
    tempPassword?: string;
    emailSent?: boolean;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      country: "",
      whatsappNumber: "",
      degree: "",
      institution: "",
      sendEmail: !isPast,
      markOnboardingCompleted: isPast,
    },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Scholar enrolled");
      setEnrolled({
        email: form.getValues("email"),
        tempPassword: state.data.tempPassword,
        emailSent: state.data.emailSent,
      });
      form.reset();
    }
    if (state && !state.ok) toast.error(state.error);
  }, [state, form]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("email", data.email);
    formData.set("country", data.country ?? "");
    formData.set("whatsappNumber", data.whatsappNumber ?? "");
    formData.set("degree", data.degree ?? "");
    formData.set("institution", data.institution ?? "");
    formData.set("sendEmail", sendEmail ? "true" : "false");
    formData.set("markOnboardingCompleted", markOnboardingCompleted ? "true" : "false");
    startTransition(() => {
      formAction(formData);
    });
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setEnrolled(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <PlusIcon className="mr-1.5 size-4" />
            Enrol Single Scholar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enrol a scholar</DialogTitle>
          <DialogDescription>
            Enrol an individual scholar into this cohort intake.
          </DialogDescription>
        </DialogHeader>

        {isPast ? (
          <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 border border-amber-500/20">
            <History className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold">Historical Entry Mode:</span> Notifications to scholars and coaches are suppressed by default for this past cohort.
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
            <Mail className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <span className="font-semibold">Current Entry Mode:</span> Active cohort enrolment. Scholar will receive an invitation email.
            </div>
          </div>
        )}

        {enrolled ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2 border">
              <p className="font-semibold text-foreground">Scholar enrolled successfully!</p>
              {enrolled.emailSent ? (
                <p className="text-muted-foreground">
                  An invitation email has been dispatched to <span className="font-medium text-foreground">{enrolled.email}</span>.
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Notification email suppressed (no email was sent to the scholar or coach).
                </p>
              )}
              {enrolled.tempPassword ? (
                <div className="pt-2">
                  <p className="mt-1">
                    Temporary password:{" "}
                    <code className="font-mono font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                      {enrolled.tempPassword}
                    </code>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You can share this password securely with the scholar if needed; it is displayed once.
                  </p>
                </div>
              ) : null}
            </div>
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
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input {...form.register("name")} placeholder="Ama Mensah" />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input {...form.register("email")} type="email" placeholder="ama@example.com" />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>

              <Field>
                <FieldLabel>Country (optional)</FieldLabel>
                <Input {...form.register("country")} placeholder="Ghana" />
                <FieldError errors={[form.formState.errors.country]} />
              </Field>

              <Field>
                <FieldLabel>WhatsApp / Phone (optional)</FieldLabel>
                <Input {...form.register("whatsappNumber")} placeholder="+233 24 123 4567" />
                <FieldError errors={[form.formState.errors.whatsappNumber]} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Institution / University (optional)</FieldLabel>
                <Input {...form.register("institution")} placeholder="University of Ghana" />
                <FieldError errors={[form.formState.errors.institution]} />
              </Field>

              <Field>
                <FieldLabel>Degree (optional)</FieldLabel>
                <Input {...form.register("degree")} placeholder="MSc Computer Science" />
                <FieldError errors={[form.formState.errors.degree]} />
              </Field>
            </div>

            <div className="flex flex-col gap-3 pt-2 border-t">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Mail className="size-3.5 text-muted-foreground" />
                    <Label htmlFor="send-email-switch">Send invitation email</Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Dispatches account login email. Leave off for past/historical scholars.
                  </p>
                </div>
                <Switch
                  id="send-email-switch"
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <CheckCircle2 className="size-3.5 text-muted-foreground" />
                    <Label htmlFor="onboarding-switch">Mark onboarding as completed</Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Pre-completes scholar onboarding. Ideal for historical scholars.
                  </p>
                </div>
                <Switch
                  id="onboarding-switch"
                  checked={markOnboardingCompleted}
                  onCheckedChange={setMarkOnboardingCompleted}
                />
              </div>
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enrolling…" : "Enrol scholar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
