import { Suspense } from "react";

import { CohortCreateForm } from "@/features/cohort/components/cohort-create-form";
import {
  CohortList,
  CohortListSkeleton,
} from "@/features/cohort/components/cohort-list";

export default function CohortsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Cohorts</h1>
      <CohortCreateForm />
      <Suspense fallback={<CohortListSkeleton />}>
        <CohortList />
      </Suspense>
    </div>
  );
}
