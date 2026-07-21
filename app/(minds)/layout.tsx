import { Suspense } from "react";

import { MindsNav } from "@/components/minds-nav";
import { MindsGate } from "@/lib/role-gate";

function MindsNavFallback() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
      <span className="font-semibold">ZUVA MINDS</span>
      <div className="h-9 w-20 rounded border border-zinc-300 dark:border-zinc-700" />
    </header>
  );
}

export default function MindsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<MindsNavFallback />}>
        <MindsNav />
      </Suspense>
      <MindsGate>{children}</MindsGate>
    </div>
  );
}
