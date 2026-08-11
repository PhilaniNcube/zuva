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
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { page, pageSize, country, onboardingStatus } =
    await searchParamsCache.parse(searchParams);

  return (
    <Suspense key={`${id}-${page}-${pageSize}-${country}-${onboardingStatus}`} fallback={<CohortDetailSkeleton />}>
      <CohortDetail
        id={id}
        page={page}
        pageSize={pageSize}
        country={country}
        onboardingStatus={onboardingStatus}
      />
    </Suspense>
  );
}
