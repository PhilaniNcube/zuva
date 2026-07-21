import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Coaches" };

import { CoachCreateForm } from "@/features/coach/components/coach-create-form";
import {
  CoachDirectory,
  CoachDirectorySkeleton,
} from "@/features/coach/components/coach-directory";

export default function CoachesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Coach directory</h1>
        <CoachCreateForm />
      </div>
      <Suspense fallback={<CoachDirectorySkeleton />}>
        <CoachDirectory />
      </Suspense>
    </div>
  );
}
