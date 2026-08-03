import { Suspense } from "react";
import type { Metadata } from "next";
import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

import { CoachCreateForm } from "@/features/coach/components/coach-create-form";
import {
  CoachList,
  CoachListSkeleton,
} from "@/features/coach/components/coach-list";

export const metadata: Metadata = { title: "Coaches" };

const coachSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
  specialty: parseAsString.withDefault(""),
});

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page, pageSize, search, specialty } =
    await coachSearchParamsCache.parse(searchParams);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Coach directory</h1>
        <CoachCreateForm />
      </div>
      <Suspense fallback={<CoachListSkeleton />}>
        <CoachList
          page={page}
          pageSize={pageSize}
          search={search}
          specialty={specialty}
        />
      </Suspense>
    </div>
  );
}
