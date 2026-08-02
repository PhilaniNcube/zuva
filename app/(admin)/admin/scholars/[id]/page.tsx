import { Suspense } from "react";
import type { Metadata } from "next";

import {
  AdminScholarOverview,
  AdminScholarOverviewSkeleton,
} from "@/features/scholar/components/admin-scholar-overview";
import { requireRole } from "@/lib/rbac";

export const metadata: Metadata = { title: "Scholar | ZUVA Admin" };

export default async function AdminScholarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");

  return (
    <Suspense fallback={<AdminScholarOverviewSkeleton />}>
      <AdminScholarOverview id={params.then((p) => p.id)} />
    </Suspense>
  );
}
