import { Suspense } from "react";
import type { Metadata } from "next";

import {
  ReportDashboard,
  ReportDashboardSkeleton,
} from "@/features/report/components/report-dashboard";
import { requireRole } from "@/lib/rbac";

export const metadata: Metadata = { title: "Programme Reports" };

export default async function ReportsPage() {
  const { user } = await requireRole("minds");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Programme Reports</h1>
      <p className="text-sm text-zinc-500">
        Signed in as {user.name} ({user.email})
      </p>

      <Suspense fallback={<ReportDashboardSkeleton />}>
        <ReportDashboard />
      </Suspense>
    </div>
  );
}
