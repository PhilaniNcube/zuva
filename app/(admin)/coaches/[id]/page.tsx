import { Suspense } from "react";
import type { Metadata } from "next";

import {
  CoachDetail,
  CoachDetailSkeleton,
} from "@/features/coach/components/coach-detail";

export const metadata: Metadata = { title: "Coach Detail" };

export default async function AdminCoachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<CoachDetailSkeleton />}>
      <CoachDetail id={id} />
    </Suspense>
  );
}
