"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";
import { roleHome } from "@/lib/roles";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormState = {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  async function loginAction(
    prevState: FormState,
    formData: FormData,
  ): Promise<FormState> {
    const data = Object.fromEntries(formData.entries());
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      return {
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { data: authData, error } = await signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      toast.error(error.message ?? "Sign-in failed");
      return { error: error.message ?? "Sign-in failed" };
    }

    toast.success("Signed in");
    const role = (authData?.user as { role?: string } | undefined)?.role;
    const next = searchParams.get("next");
    const target =
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : roleHome(role ?? "scholar");
    router.push(target);
    router.refresh();

    return {};
  }

  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          defaultValue=""
        />
        <FieldError
          errors={state.fieldErrors?.email?.map((msg) => ({ message: msg }))}
        />
      </Field>
      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel>Password</FieldLabel>
          <Link
            href="/forgot-password"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          defaultValue=""
        />
        <FieldError
          errors={state.fieldErrors?.password?.map((msg) => ({ message: msg }))}
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

