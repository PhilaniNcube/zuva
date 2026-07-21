import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Learning Pathway" };

import {
  CertificateStatus,
  CertificateStatusSkeleton,
} from "@/features/certificate/components/certificate-status";
import {
  PathwayChecklist,
  PathwayChecklistSkeleton,
} from "@/features/pathway/components/pathway-checklist";
import { getScholarProfile } from "@/features/user/user-queries";
import { requireRole } from "@/lib/rbac";

export default async function PathwayPage() {
  const { user } = await requireRole("scholar");
  const profile = await getScholarProfile(user.id);

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">My Learning Pathway</h1>

      <Suspense fallback={<CertificateStatusSkeleton />}>
        <CertificateStatus scholarId={user.id} />
      </Suspense>

      {profile?.cohortId ? (
        <Suspense fallback={<PathwayChecklistSkeleton />}>
          <PathwayChecklist scholarId={user.id} cohortId={profile.cohortId} />
        </Suspense>
      ) : (
        <p className="text-sm text-zinc-500">
          You are not enrolled in a cohort yet.
        </p>
      )}
    </div>
  );
}
