import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resources" };

import { listCohorts } from "@/features/cohort/cohort-queries";
import {
  ResourceList,
  ResourceListSkeleton,
} from "@/features/resource/components/resource-list";
import { ResourceUploadForm } from "@/features/resource/components/resource-upload-form";
import { requireRole } from "@/lib/rbac";

export default async function AdminResourcesPage() {
  await requireRole("admin");
  const cohorts = await listCohorts();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Resources</h1>
      <ResourceUploadForm
        cohorts={cohorts.map((c) => ({ id: c.id, name: c.name }))}
      />
      <Suspense fallback={<ResourceListSkeleton />}>
        <ResourceList cohortId={null} adminControls />
      </Suspense>
    </div>
  );
}
