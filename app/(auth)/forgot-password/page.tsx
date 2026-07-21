import { Suspense } from "react";

import { ForgotPasswordForm } from "@/features/user/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">ZUVA Scholar Hub</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Reset your account password
        </p>
      </div>
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </main>
  );
}
