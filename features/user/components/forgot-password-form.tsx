"use client";

import Link from "next/link";
import { useState, useActionState } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    email?: string[];
  };
};

export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string>("");

  async function forgotPasswordAction(
    prevState: FormState,
    formData: FormData,
  ): Promise<FormState> {
    const emailInput = formData.get("email") as string;
    const parsed = schema.safeParse({ email: emailInput });

    if (!parsed.success) {
      return {
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { error } = await authClient.requestPasswordReset({
      email: parsed.data.email,
      redirectTo: "/reset-password",
    });

    if (error) {
      toast.error(error.message ?? "Failed to request password reset");
      return { error: error.message ?? "Failed to request password reset" };
    }

    setSubmittedEmail(parsed.data.email);
    toast.success("Password reset email sent");
    return { success: true };
  }

  const [state, action, pending] = useActionState(forgotPasswordAction, {});

  if (state.success) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4 text-center">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            We sent a password reset link to{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-200">
              {submittedEmail}
            </span>
            . Please check your inbox.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          defaultValue=""
          placeholder="scholar@example.com"
        />
        <FieldError
          errors={state.fieldErrors?.email?.map((msg) => ({ message: msg }))}
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending link…" : "Send reset link"}
      </Button>
      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
