import { Suspense } from "react";

import { ScholarNav } from "@/components/scholar-nav";
import { ScholarGate } from "@/lib/role-gate";

function ScholarNavFallback() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
      <span className="font-semibold">ZUVA</span>
      <div className="h-9 w-20 rounded border border-zinc-300 dark:border-zinc-700" />
    </header>
  );
}

export default function ScholarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<ScholarNavFallback />}>
        <ScholarNav />
      </Suspense>
      <ScholarGate>{children}</ScholarGate>
    </div>
  );
}
