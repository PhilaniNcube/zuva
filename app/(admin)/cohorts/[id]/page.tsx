import { Suspense } from "react";

import {
  CohortDetail,
  CohortDetailSkeleton,
} from "@/features/cohort/components/cohort-detail";

export default function CohortDetailPage({
  params,
}: PageProps<"/cohorts/[id]">) {
  return (
    <Suspense fallback={<CohortDetailSkeleton />}>
      <CohortDetail id={params.then((p) => p.id)} />
    </Suspense>
  );
}
