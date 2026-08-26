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
    <form action={action} className="flex w-full max-w-sm flex-col gap-3.5">
      <Field className="gap-1">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email Address"
          defaultValue=""
          className="h-12 rounded-none border border-white/50 bg-white/60 px-4 text-base font-normal text-zinc-900 shadow-md backdrop-blur-xs transition-all placeholder:text-zinc-600 focus-visible:border-brand-red focus-visible:bg-white/90 focus-visible:ring-2 focus-visible:ring-brand-red/40 sm:text-sm dark:bg-white/60 dark:text-zinc-900 dark:placeholder:text-zinc-600"
        />
        <FieldError
          errors={state.fieldErrors?.email?.map((msg) => ({ message: msg }))}
        />
      </Field>
      <Field className="gap-1">
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          defaultValue=""
          className="h-12 rounded-none border border-white/50 bg-white/60 px-4 text-base font-normal text-zinc-900 shadow-md backdrop-blur-xs transition-all placeholder:text-zinc-600 focus-visible:border-brand-red focus-visible:bg-white/90 focus-visible:ring-2 focus-visible:ring-brand-red/40 sm:text-sm dark:bg-white/60 dark:text-zinc-900 dark:placeholder:text-zinc-600"
        />
        <div className="flex justify-end px-0.5 pt-0.5">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-white drop-shadow-xs hover:text-zinc-100 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <FieldError
          errors={state.fieldErrors?.password?.map((msg) => ({ message: msg }))}
        />
      </Field>
      <Button
        type="submit"
        disabled={pending}
        className="clip-chamfer-btn mt-1 h-12 w-full cursor-pointer rounded-tr-none rounded-br-none rounded-bl-none rounded-tl-xl border-0 bg-brand-red/60 font-bold text-lg tracking-wide text-white shadow-lg shadow-brand-red/20 backdrop-blur-xs transition-all hover:bg-brand-red/80 active:scale-[0.99] disabled:opacity-75 dark:bg-brand-red/60"
      >
        {pending ? "signing-in…" : "sign-in"}
      </Button>
    </form>
  );
}

