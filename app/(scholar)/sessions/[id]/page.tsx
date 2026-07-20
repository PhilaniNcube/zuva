import { Suspense } from "react";

import {
  SessionDetail,
  SessionDetailSkeleton,
} from "@/features/session/components/session-detail";

export default function SessionDetailPage({
  params,
}: PageProps<"/sessions/[id]">) {
  return (
    <main className="min-h-screen p-8">
      <Suspense fallback={<SessionDetailSkeleton />}>
        <SessionDetail id={params.then((p) => p.id)} />
      </Suspense>
    </main>
  );
}
