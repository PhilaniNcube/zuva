"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
});

type FormValues = z.infer<typeof schema>;

async function action(
  cohortId: string,
  _prev: ActionResult<{ tempPassword: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ tempPassword: string }>> {
  return enrollScholar({
    cohortId,
    name: formData.get("name"),
    email: formData.get("email"),
    country: formData.get("country"),
  });
}

export function ScholarEnrollForm({ cohortId }: { cohortId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    action.bind(null, cohortId),
    null,
  );
  const [enrolled, setEnrolled] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", country: "" },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success("Scholar enrolled");
      setEnrolled({
        email: form.getValues("email"),
        tempPassword: state.data.tempPassword,
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
          <Button>
            <PlusIcon className="mr-1.5 size-4" />
            Enrol Scholar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enrol a new scholar</DialogTitle>
          <DialogDescription>
            Add a scholar to this cohort and generate their temporary password.
          </DialogDescription>
        </DialogHeader>

        {enrolled ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <p className="font-semibold">Scholar enrolled successfully!</p>
              <p className="mt-1">
                Account created for <span className="font-medium">{enrolled.email}</span>. Temporary password:{" "}
                <code className="font-mono font-semibold bg-green-100 dark:bg-green-800/50 px-1.5 py-0.5 rounded">
                  {enrolled.tempPassword}
                </code>
              </p>
              <p className="mt-2 text-xs opacity-90">
                Share this password securely with the scholar; it is only displayed once.
              </p>
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
