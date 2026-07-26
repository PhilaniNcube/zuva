import { Suspense } from "react";
import type { Metadata } from "next";

import {
  CertificateAdminList,
  CertificateAdminListSkeleton,
} from "@/features/certificate/components/certificate-admin-list";
import {
  CertificatesSummaryCard,
  CertificatesSummaryCardSkeleton,
} from "@/features/dashboard/components/certificates-summary-card";
import {
  ScholarsSummaryCard,
  ScholarsSummaryCardSkeleton,
} from "@/features/dashboard/components/scholars-summary-card";
import {
  SessionsSummaryCard,
  SessionsSummaryCardSkeleton,
} from "@/features/dashboard/components/sessions-summary-card";
import {
  SubmissionsSummaryCard,
  SubmissionsSummaryCardSkeleton,
} from "@/features/dashboard/components/submissions-summary-card";
import { requireRole } from "@/lib/rbac";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const { user } = await requireRole("admin");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Programme Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user.name}. Here is your programme status overview.
        </p>
      </div>

      {/* Summary Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<ScholarsSummaryCardSkeleton />}>
          <ScholarsSummaryCard />
        </Suspense>
        <Suspense fallback={<SessionsSummaryCardSkeleton />}>
          <SessionsSummaryCard />
        </Suspense>
        <Suspense fallback={<SubmissionsSummaryCardSkeleton />}>
          <SubmissionsSummaryCard />
        </Suspense>
        <Suspense fallback={<CertificatesSummaryCardSkeleton />}>
          <CertificatesSummaryCard />
        </Suspense>
      </section>

      {/* Certificate Management Section */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Certificates Overview</h2>
        <Suspense fallback={<CertificateAdminListSkeleton />}>
          <CertificateAdminList />
        </Suspense>
      </section>
    </div>
  );
}
