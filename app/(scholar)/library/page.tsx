import { Suspense } from "react";
import type { Metadata } from "next";
import { createSearchParamsCache, parseAsString } from "nuqs/server";

export const metadata: Metadata = { title: "Resource Library" };

import {
  ResourceList,
  ResourceListSkeleton,
} from "@/features/resource/components/resource-list";
import { ResourceSearch } from "@/features/resource/components/resource-search";
import { getScholarProfile } from "@/features/user/user-queries";
import { requireRole } from "@/lib/rbac";

const librarySearchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
});

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireRole("scholar");
  const [{ q }] = await Promise.all([
    librarySearchParamsCache.parse(searchParams),
    getScholarProfile(user.id),
  ]);

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Resource library</h1>
        <p className="text-sm text-zinc-500">
          Session materials, reading lists, and reference documents from your
          coaches.
        </p>
      </div>
      <ResourceSearch />
      <Suspense fallback={<ResourceListSkeleton />}>
        <ResourceList scholarId={user.id} search={q} />
      </Suspense>
    </main>
  );
}
