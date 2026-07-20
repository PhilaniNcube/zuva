import { Suspense } from "react";

import { listCohorts } from "@/features/cohort/cohort-queries";
import { listCoaches } from "@/features/coach/coach-queries";
import {
  AdminSessionList,
  AdminSessionListSkeleton,
} from "@/features/session/components/admin-session-list";
import { CohortSessionForm } from "@/features/session/components/cohort-session-form";
import { requireRole } from "@/lib/rbac";

export default async function SchedulePage() {
  await requireRole("admin");
  const [cohorts, coaches] = await Promise.all([listCohorts(), listCoaches()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Schedule</h1>
      <CohortSessionForm
        cohorts={cohorts.map((c) => ({ id: c.id, name: c.name }))}
        coaches={coaches.map((c) => ({ id: c.id, name: c.name }))}
      />
      <Suspense fallback={<AdminSessionListSkeleton />}>
        <AdminSessionList />
      </Suspense>
    </div>
  );
}
