"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormState = {
  error?: string;
  fieldErrors?: {
    password?: string[];
    confirmPassword?: string[];
  };
};

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  async function resetPasswordAction(
    prevState: FormState,
    formData: FormData,
  ): Promise<FormState> {
    if (!token) {
      toast.error("Invalid or missing reset token");
      return { error: "Invalid or missing reset token" };
    }

    const data = Object.fromEntries(formData.entries());
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      return {
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { error } = await authClient.resetPassword({
      newPassword: parsed.data.password,
      token,
    });

    if (error) {
      toast.error(error.message ?? "Failed to reset password");
      return { error: error.message ?? "Failed to reset password" };
    }

    toast.success("Password reset successfully. You can now sign in.");
    router.push("/login");
    return {};
  }

  const [state, action, pending] = useActionState(resetPasswordAction, {});

  if (!token) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
          <h2 className="text-lg font-medium text-red-900 dark:text-red-200">
            Invalid Reset Link
          </h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            This password reset link is invalid or expired. Please request a new
            password reset link.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {state.error}
        </div>
      )}
      <Field>
        <FieldLabel>New Password</FieldLabel>
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          defaultValue=""
        />
        <FieldError
          errors={state.fieldErrors?.password?.map((msg) => ({ message: msg }))}
        />
      </Field>
      <Field>
        <FieldLabel>Confirm New Password</FieldLabel>
        <Input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          defaultValue=""
        />
        <FieldError
          errors={state.fieldErrors?.confirmPassword?.map((msg) => ({
            message: msg,
          }))}
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Resetting password…" : "Reset password"}
      </Button>
    </form>
  );
}
