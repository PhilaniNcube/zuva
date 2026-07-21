import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/user/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">ZUVA Scholar Hub</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter a new password for your account
        </p>
      </div>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
