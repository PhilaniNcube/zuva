"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserPen, Loader2, Building2, GraduationCap, Globe, Phone, ExternalLink, FileText, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/lib/action-result";
import { adminUpdateScholarProfile } from "@/features/user/user-actions";

const schema = z.object({
  name: z.string().trim().min(2, "Full name is required").max(100),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  degree: z.string().trim().max(150).optional().or(z.literal("")),
  institution: z.string().trim().max(150).optional().or(z.literal("")),
  whatsappNumber: z.string().trim().max(30).optional().or(z.literal("")),
  linkedinUrl: z.string().trim().max(300).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  mtpText: z.string().trim().max(500).optional().or(z.literal("")),
  cohortId: z.string().trim().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export interface CohortOption {
  id: string;
  name: string;
  status?: string;
}

export interface ScholarProfileData {
  id: string; // user id
  name: string;
  email: string;
  country?: string | null;
  degree?: string | null;
  institution?: string | null;
  whatsappNumber?: string | null;
  linkedinUrl?: string | null;
  bio?: string | null;
  mtpText?: string | null;
  cohortId?: string | null;
}

interface EditScholarDialogProps {
  scholar: ScholarProfileData;
  cohorts?: CohortOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function action(
  userId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  return adminUpdateScholarProfile({
    userId,
    name: formData.get("name"),
    country: formData.get("country"),
    degree: formData.get("degree"),
    institution: formData.get("institution"),
    whatsappNumber: formData.get("whatsappNumber"),
    linkedinUrl: formData.get("linkedinUrl"),
    bio: formData.get("bio"),
    mtpText: formData.get("mtpText"),
    cohortId: formData.get("cohortId"),
  });
}

export function EditScholarDialog({
  scholar,
  cohorts = [],
  open,
  onOpenChange,
}: EditScholarDialogProps) {
  const [state, formAction, isPending] = useActionState(
    action.bind(null, scholar.id),
    null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: scholar.name || "",
      country: scholar.country || "",
      degree: scholar.degree || "",
      institution: scholar.institution || "",
      whatsappNumber: scholar.whatsappNumber || "",
      linkedinUrl: scholar.linkedinUrl || "",
      bio: scholar.bio || "",
      mtpText: scholar.mtpText || "",
      cohortId: scholar.cohortId || "",
    },
  });

  useEffect(() => {
    form.reset({
      name: scholar.name || "",
      country: scholar.country || "",
      degree: scholar.degree || "",
      institution: scholar.institution || "",
      whatsappNumber: scholar.whatsappNumber || "",
      linkedinUrl: scholar.linkedinUrl || "",
      bio: scholar.bio || "",
      mtpText: scholar.mtpText || "",
      cohortId: scholar.cohortId || "",
    });
  }, [scholar, form]);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Scholar profile updated successfully");
      onOpenChange(false);
    }
    if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state, onOpenChange]);

  function onSubmit(data: FormValues) {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("country", data.country || "");
    formData.set("degree", data.degree || "");
    formData.set("institution", data.institution || "");
    formData.set("whatsappNumber", data.whatsappNumber || "");
    formData.set("linkedinUrl", data.linkedinUrl || "");
    formData.set("bio", data.bio || "");
    formData.set("mtpText", data.mtpText || "");
    formData.set("cohortId", data.cohortId || "");

    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPen className="size-5 text-primary" />
            Edit Scholar Profile
          </DialogTitle>
          <DialogDescription>
            Update academic and personal details for {scholar.name} ({scholar.email}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Full Name *</FieldLabel>
              <Input
                {...form.register("name")}
                placeholder="e.g. Tendai Mbare"
                disabled={isPending}
              />
              {form.formState.errors.name && (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel className="flex items-center gap-1.5">
                <Globe className="size-3.5 text-muted-foreground" />
                Country
              </FieldLabel>
              <Input
                {...form.register("country")}
                placeholder="e.g. Zimbabwe, South Africa"
                disabled={isPending}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel className="flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground" />
                Institution / University
              </FieldLabel>
              <Input
                {...form.register("institution")}
                placeholder="e.g. University of Cape Town"
                disabled={isPending}
              />
            </Field>

            <Field>
              <FieldLabel className="flex items-center gap-1.5">
                <GraduationCap className="size-3.5 text-muted-foreground" />
                Degree / Qualification
              </FieldLabel>
              <Input
                {...form.register("degree")}
                placeholder="e.g. MSc Computer Science"
                disabled={isPending}
              />
            </Field>
          </div>

          {cohorts.length > 0 && (
            <Field>
              <FieldLabel className="flex items-center gap-1.5">
                <GraduationCap className="size-3.5 text-primary" />
                Assigned Cohort Intake
              </FieldLabel>
              <Controller
                control={form.control}
                name="cohortId"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select cohort intake..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned (No Cohort)</SelectItem>
                      {cohorts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.status ? `(${c.status})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" />
                WhatsApp Number
              </FieldLabel>
              <Input
                {...form.register("whatsappNumber")}
                placeholder="e.g. +27821234567"
                disabled={isPending}
              />
            </Field>

            <Field>
              <FieldLabel className="flex items-center gap-1.5">
                <ExternalLink className="size-3.5 text-muted-foreground" />
                LinkedIn URL
              </FieldLabel>
              <Input
                {...form.register("linkedinUrl")}
                placeholder="https://linkedin.com/in/..."
                disabled={isPending}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel className="flex items-center gap-1.5">
              <FileText className="size-3.5 text-muted-foreground" />
              Bio / Research Overview
            </FieldLabel>
            <Textarea
              {...form.register("bio")}
              rows={3}
              placeholder="Brief summary of research focus or academic goals..."
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel className="flex items-center gap-1.5">
              <Target className="size-3.5 text-muted-foreground" />
              Massive Transformative Purpose (MTP)
            </FieldLabel>
            <Textarea
              {...form.register("mtpText")}
              rows={2}
              placeholder="Scholar's core vision statement..."
              disabled={isPending}
            />
          </Field>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
