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
import { getScholarCohorts } from "@/features/user/user-queries";
import { requireRole } from "@/lib/rbac";

export default async function PathwayPage() {
  const { user } = await requireRole("scholar");
  const enrolledCohorts = await getScholarCohorts(user.id);

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">My Learning Pathway</h1>

      <Suspense fallback={<CertificateStatusSkeleton />}>
        <CertificateStatus scholarId={user.id} />
      </Suspense>

      {enrolledCohorts.length > 0 ? (
        <div className="flex flex-col gap-8">
          {enrolledCohorts.map((c) => (
            <section key={c.id} className="flex flex-col gap-3">
              {enrolledCohorts.length > 1 ? (
                <h2 className="text-lg font-semibold text-foreground">
                  Pathway — {c.name}
                </h2>
              ) : null}
              <Suspense fallback={<PathwayChecklistSkeleton />}>
                <PathwayChecklist scholarId={user.id} cohortId={c.id} />
              </Suspense>
            </section>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          You are not enrolled in a cohort yet.
        </p>
      )}
    </div>
  );
}
