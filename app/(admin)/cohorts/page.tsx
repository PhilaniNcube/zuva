import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cohorts" };

import { CohortCreateForm } from "@/features/cohort/components/cohort-create-form";
import {
  CohortList,
  CohortListSkeleton,
} from "@/features/cohort/components/cohort-list";

export default function CohortsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cohorts</h1>
        <CohortCreateForm />
      </div>
      <Suspense fallback={<CohortListSkeleton />}>
        <CohortList />
      </Suspense>
    </div>
  );
}
