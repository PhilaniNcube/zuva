import { Suspense } from "react";
import type { Metadata } from "next";
import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

import { CohortCreateForm } from "@/features/cohort/components/cohort-create-form";
import {
  CohortList,
  CohortListSkeleton,
} from "@/features/cohort/components/cohort-list";

export const metadata: Metadata = { title: "Cohorts" };

const cohortSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  startDate: parseAsString.withDefault(""),
  endDate: parseAsString.withDefault(""),
});

export default async function CohortsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page, pageSize, startDate, endDate } =
    await cohortSearchParamsCache.parse(searchParams);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cohorts</h1>
        <CohortCreateForm />
      </div>
      <Suspense fallback={<CohortListSkeleton />}>
        <CohortList
          page={page}
          pageSize={pageSize}
          startDate={startDate}
          endDate={endDate}
        />
      </Suspense>
    </div>
  );
}
