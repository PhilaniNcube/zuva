import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Submissions" };

import {
  ScholarSubmissions,
  ScholarSubmissionsSkeleton,
} from "@/features/submission/components/scholar-submissions";
import { SubmissionUploadForm } from "@/features/submission/components/upload-form";
import { requireRole } from "@/lib/rbac";

export default async function SubmissionsPage() {
  const { user } = await requireRole("scholar");
  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">My submissions</h1>
        <p className="text-sm text-zinc-500">
          Upload drafts, theses, and other documents for critical review and
          language editing. Track each submission through to the returned file.
        </p>
      </div>
      <SubmissionUploadForm />
      <Suspense fallback={<ScholarSubmissionsSkeleton />}>
        <ScholarSubmissions scholarId={user.id} />
      </Suspense>
    </main>
  );
}
