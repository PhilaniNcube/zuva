"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  Globe,
  Phone,
  FileText,
} from "lucide-react";

import { changeUserPassword, updateProfileDetails } from "@/features/user/user-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ActionResult } from "@/lib/action-result";
import type { Role } from "@/lib/roles";
import type { scholarProfile } from "@/lib/db/schema";

const detailsSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  whatsappNumber: z.string().trim().max(30).optional().or(z.literal("")),
  linkedinUrl: z.string().trim().max(300).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  mtpText: z.string().trim().max(500).optional().or(z.literal("")),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
    revokeOtherSessions: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

async function submitDetailsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return updateProfileDetails({
    name: formData.get("name"),
    country: formData.get("country"),
    whatsappNumber: formData.get("whatsappNumber"),
    linkedinUrl: formData.get("linkedinUrl"),
    bio: formData.get("bio"),
    mtpText: formData.get("mtpText"),
  });
}

async function submitPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return changeUserPassword({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
    revokeOtherSessions: formData.get("revokeOtherSessions") === "true",
  });
}

interface ProfileEditFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  scholarProfileData?: typeof scholarProfile.$inferSelect | null;
}

export function ProfileEditForm({ user, scholarProfileData }: ProfileEditFormProps) {
  // Details form with useActionState + react-hook-form
  const [detailsState, detailsFormAction, isDetailsPending] = useActionState(
    submitDetailsAction,
    null,
  );

  const detailsForm = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: user.name || "",
      country: scholarProfileData?.country || "",
      whatsappNumber: scholarProfileData?.whatsappNumber || "",
      linkedinUrl: scholarProfileData?.linkedinUrl || "",
      bio: scholarProfileData?.bio || "",
      mtpText: scholarProfileData?.mtpText || "",
    },
  });

  useEffect(() => {
    if (detailsState?.ok) {
      toast.success("Profile details updated successfully");
    }
    if (detailsState && !detailsState.ok) {
      toast.error(detailsState.error);
    }
  }, [detailsState]);

  function onDetailsSubmit(data: DetailsFormValues) {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("country", data.country ?? "");
    formData.set("whatsappNumber", data.whatsappNumber ?? "");
    formData.set("linkedinUrl", data.linkedinUrl ?? "");
    formData.set("bio", data.bio ?? "");
    formData.set("mtpText", data.mtpText ?? "");

    startTransition(() => {
      detailsFormAction(formData);
    });
  }

  // Password form with useActionState + react-hook-form
  const [passwordState, passwordFormAction, isPasswordPending] = useActionState(
    submitPasswordAction,
    null,
  );

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    },
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (passwordState?.ok) {
      toast.success("Password updated successfully");
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        revokeOtherSessions: true,
      });
    }
    if (passwordState && !passwordState.ok) {
      toast.error(passwordState.error);
    }
  }, [passwordState, passwordForm]);

  function onPasswordSubmit(data: PasswordFormValues) {
    const formData = new FormData();
    formData.set("currentPassword", data.currentPassword);
    formData.set("newPassword", data.newPassword);
    formData.set("confirmPassword", data.confirmPassword);
    formData.set("revokeOtherSessions", String(data.revokeOtherSessions));

    startTransition(() => {
      passwordFormAction(formData);
    });
  }

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="details" className="flex items-center gap-2">
          <User className="size-4" />
          Edit Details
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Lock className="size-4" />
          Security & Password
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Personal Details */}
      <TabsContent value="details">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="size-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your display name and profile information.
            </CardDescription>
          </CardHeader>

          <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)}>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  {...detailsForm.register("name")}
                  placeholder="Enter your full name"
                />
                <FieldError errors={[detailsForm.formState.errors.name]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email address cannot be changed directly for security reasons.
                </p>
              </Field>

              {user.role === "scholar" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <Field>
                      <FieldLabel htmlFor="country" className="flex items-center gap-1.5">
                        <Globe className="size-3.5" />
                        Country
                      </FieldLabel>
                      <Input
                        id="country"
                        {...detailsForm.register("country")}
                        placeholder="e.g. Kenya, Zimbabwe, Nigeria"
                      />
                      <FieldError errors={[detailsForm.formState.errors.country]} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="whatsappNumber" className="flex items-center gap-1.5">
                        <Phone className="size-3.5" />
                        WhatsApp Number
                      </FieldLabel>
                      <Input
                        id="whatsappNumber"
                        {...detailsForm.register("whatsappNumber")}
                        placeholder="+254..."
                      />
                      <FieldError
                        errors={[detailsForm.formState.errors.whatsappNumber]}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="linkedinUrl" className="flex items-center gap-1.5">
                      <Globe className="size-3.5" />
                      LinkedIn Profile URL
                    </FieldLabel>
                    <Input
                      id="linkedinUrl"
                      {...detailsForm.register("linkedinUrl")}
                      placeholder="https://linkedin.com/in/username"
                    />
                    <FieldError
                      errors={[detailsForm.formState.errors.linkedinUrl]}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="bio" className="flex items-center gap-1.5">
                      <User className="size-3.5" />
                      Bio & Research Focus
                    </FieldLabel>
                    <Textarea
                      id="bio"
                      {...detailsForm.register("bio")}
                      placeholder="Share a brief overview of your background and research..."
                      rows={3}
                    />
                    <FieldError errors={[detailsForm.formState.errors.bio]} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="mtpText" className="flex items-center gap-1.5">
                      <FileText className="size-3.5" />
                      Massive Transformative Purpose (MTP)
                    </FieldLabel>
                    <Textarea
                      id="mtpText"
                      {...detailsForm.register("mtpText")}
                      placeholder="What impact do you intend to make through your scholar journey?"
                      rows={2}
                    />
                    <FieldError errors={[detailsForm.formState.errors.mtpText]} />
                  </Field>
                </>
              )}
            </CardContent>

            <CardFooter className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={isDetailsPending}>
                <Save className="mr-2 size-4" />
                {isDetailsPending ? "Saving Details…" : "Save Details"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      {/* Tab 2: Security & Password */}
      <TabsContent value="security">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Password & Security
            </CardTitle>
            <CardDescription>
              Ensure your account is using a strong password. Confirming your current password is required.
            </CardDescription>
          </CardHeader>

          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
            <CardContent className="space-y-4">
              {/* Current Password */}
              <Field>
                <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    {...passwordForm.register("currentPassword")}
                    placeholder="Enter your current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
                <FieldError
                  errors={[passwordForm.formState.errors.currentPassword]}
                />
              </Field>

              {/* New Password */}
              <Field>
                <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    {...passwordForm.register("newPassword")}
                    placeholder="At least 8 characters"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
                <FieldError errors={[passwordForm.formState.errors.newPassword]} />
              </Field>

              {/* Confirm New Password */}
              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...passwordForm.register("confirmPassword")}
                    placeholder="Re-enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
                <FieldError
                  errors={[passwordForm.formState.errors.confirmPassword]}
                />
              </Field>

              {/* Revoke Sessions Option */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border/50 mt-4">
                <div className="space-y-0.5">
                  <FieldLabel className="text-sm font-medium cursor-pointer">
                    Sign out of other devices
                  </FieldLabel>
                  <p className="text-xs text-muted-foreground">
                    Revoke active sessions on all other browsers and devices.
                  </p>
                </div>
                <Controller
                  control={passwordForm.control}
                  name="revokeOtherSessions"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={isPasswordPending}>
                <Lock className="mr-2 size-4" />
                {isPasswordPending ? "Updating Password…" : "Update Password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
