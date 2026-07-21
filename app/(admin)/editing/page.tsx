import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editing Queue" };

import {
  EditingQueue,
  EditingQueueSkeleton,
} from "@/features/submission/components/editing-queue";
import { QueueFilter } from "@/features/submission/components/queue-filter";

export default async function EditingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editing requests</h1>
        <QueueFilter />
      </div>
      <Suspense fallback={<EditingQueueSkeleton />}>
        <EditingQueue statusFilter={status ?? null} />
      </Suspense>
    </div>
  );
}
