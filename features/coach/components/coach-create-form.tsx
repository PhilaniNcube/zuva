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

async function action(
  _prev: ActionResult<{ tempPassword: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ tempPassword: string }>> {
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
      toast.success("Coach added");
      setCreated({
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
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <p className="font-semibold">Account created successfully!</p>
              <p className="mt-1">
                Account created for <span className="font-medium">{created.email}</span>. Temporary password:{" "}
                <code className="font-mono font-semibold bg-green-100 dark:bg-green-800/50 px-1.5 py-0.5 rounded">
                  {created.tempPassword}
                </code>
              </p>
              <p className="mt-2 text-xs opacity-90">
                Share this password securely with the coach; it is only displayed once.
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
