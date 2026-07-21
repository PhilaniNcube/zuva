import { Suspense } from "react";

import { AdminNav } from "@/components/admin-nav";
import { AdminGate } from "@/lib/role-gate";

function AdminNavFallback() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
      <span className="font-semibold">ZUVA Admin</span>
      <div className="h-9 w-20 rounded border border-zinc-300 dark:border-zinc-700" />
    </header>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<AdminNavFallback />}>
        <AdminNav />
      </Suspense>
      <AdminGate>{children}</AdminGate>
    </div>
  );
}
