import { Suspense } from "react";
import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

import {
  CohortDetail,
  CohortDetailSkeleton,
} from "@/features/cohort/components/cohort-detail";

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  country: parseAsString.withDefault(""),
  onboardingStatus: parseAsString.withDefault(""),
});

export default async function CohortDetailPage({
  params,
  searchParams,
}: PageProps<"/cohorts/[id]"> & {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page, pageSize, country, onboardingStatus } =
    await searchParamsCache.parse(searchParams);

  return (
    <Suspense fallback={<CohortDetailSkeleton />}>
      <CohortDetail
        id={params.then((p) => p.id)}
        page={page}
        pageSize={pageSize}
        country={country}
        onboardingStatus={onboardingStatus}
      />
    </Suspense>
  );
}
