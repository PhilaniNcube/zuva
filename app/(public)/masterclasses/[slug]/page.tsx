import { Suspense } from "react";
import type { Metadata } from "next";

import {
  MasterclassDetail,
  MasterclassDetailSkeleton,
} from "@/features/masterclass/components/masterclass-detail";

export const metadata: Metadata = {
  title: "Masterclass | ZUVA Scholar Hub",
};

export default function MasterclassPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<MasterclassDetailSkeleton />}>
      <MasterclassDetail slug={params.then((p) => p.slug)} />
    </Suspense>
  );
}
