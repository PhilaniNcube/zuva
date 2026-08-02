import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Schedule" };

import { listCohorts, listScholars } from "@/features/cohort/cohort-queries";
import { listCoaches } from "@/features/coach/coach-queries";
import {
  AdminSessionList,
  AdminSessionListSkeleton,
} from "@/features/session/components/admin-session-list";
import { CohortSessionForm } from "@/features/session/components/cohort-session-form";
import { OnboardingSessionForm } from "@/features/session/components/onboarding-session-form";
import { listSessionTypes } from "@/features/session/session-queries";
import { listProgrammeTeam } from "@/features/user/user-queries";
import { requireRole } from "@/lib/rbac";

export default async function SchedulePage() {
  await requireRole("admin");
  const [cohorts, coaches, sessionTypes, scholars, hosts] = await Promise.all([
    listCohorts(),
    listCoaches(),
    listSessionTypes({ format: "group" }),
    listScholars(),
    listProgrammeTeam(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Schedule</h1>
        <div className="flex items-center gap-2">
          <OnboardingSessionForm
            scholars={scholars}
            hosts={hosts.map((h) => ({ id: h.id, name: h.name }))}
          />
          <CohortSessionForm
            cohorts={cohorts.map((c) => ({ id: c.id, name: c.name }))}
            coaches={coaches.map((c) => ({ id: c.id, name: c.name }))}
            sessionTypes={sessionTypes}
          />
        </div>
      </div>
      <Suspense fallback={<AdminSessionListSkeleton />}>
        <AdminSessionList />
      </Suspense>
    </div>
  );
}
