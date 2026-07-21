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
      <h1 className="text-2xl font-semibold">Coach directory</h1>
      <CoachCreateForm />
      <Suspense fallback={<CoachDirectorySkeleton />}>
        <CoachDirectory />
      </Suspense>
    </div>
  );
}
