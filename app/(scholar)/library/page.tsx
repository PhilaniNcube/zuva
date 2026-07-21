import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resource Library" };

import {
  ResourceList,
  ResourceListSkeleton,
} from "@/features/resource/components/resource-list";
import { getScholarProfile } from "@/features/user/user-queries";
import { requireRole } from "@/lib/rbac";

export default async function ResourcesPage() {
  const { user } = await requireRole("scholar");
  const profile = await getScholarProfile(user.id);

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Resource library</h1>
        <p className="text-sm text-zinc-500">
          Session materials, reading lists, and reference documents from your
          coaches.
        </p>
      </div>
      <Suspense fallback={<ResourceListSkeleton />}>
        <ResourceList cohortId={profile?.cohortId ?? null} />
      </Suspense>
    </main>
  );
}
