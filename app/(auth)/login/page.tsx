import { Suspense } from "react";

import { LoginForm } from "@/features/user/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">ZUVA Scholar Hub</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sign in to your coaching journey
        </p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
