import { Suspense } from "react";
import type { Metadata } from "next";

import {
  SessionDetail,
  SessionDetailSkeleton,
} from "@/features/session/components/session-detail";

export const metadata: Metadata = { title: "Session Details" };

export default async function AdminSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<SessionDetailSkeleton />}>
      <SessionDetail id={id} />
    </Suspense>
  );
}
