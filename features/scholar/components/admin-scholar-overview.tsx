import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  AdminScholarHeader,
  AdminScholarHeaderSkeleton,
} from "./admin-scholar-header";
import {
  ScholarAttendance,
  ScholarAttendanceSkeleton,
} from "./scholar-attendance";
import {
  ScholarCertificateStatus,
  ScholarCertificateStatusSkeleton,
} from "./scholar-certificate-status";
import {
  ScholarFeedbackSummary,
  ScholarFeedbackSummarySkeleton,
} from "./scholar-feedback-summary";
import {
  ScholarSubmissions,
  ScholarSubmissionsSkeleton,
} from "./scholar-submissions";
import {
  ScholarUpcomingSessions,
  ScholarUpcomingSessionsSkeleton,
} from "./scholar-upcoming-sessions";
import {
  ScholarBioSection,
  ScholarBioSectionSkeleton,
} from "./scholar-bio-section";

export async function AdminScholarOverview({ id }: { id: Promise<string> }) {
  const scholarId = await id;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/cohorts"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to cohorts
        </Link>
      </div>

      <Suspense fallback={<AdminScholarHeaderSkeleton />}>
        <AdminScholarHeader scholarId={scholarId} />
      </Suspense>

      <Suspense fallback={<ScholarBioSectionSkeleton />}>
        <ScholarBioSection scholarId={scholarId} />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<ScholarAttendanceSkeleton />}>
          <ScholarAttendance scholarId={scholarId} />
        </Suspense>
        <Suspense fallback={<ScholarUpcomingSessionsSkeleton />}>
          <ScholarUpcomingSessions scholarId={scholarId} />
        </Suspense>
        <Suspense fallback={<ScholarFeedbackSummarySkeleton />}>
          <ScholarFeedbackSummary scholarId={scholarId} />
        </Suspense>
        <Suspense fallback={<ScholarSubmissionsSkeleton />}>
          <ScholarSubmissions scholarId={scholarId} />
        </Suspense>
        <Suspense fallback={<ScholarCertificateStatusSkeleton />}>
          <ScholarCertificateStatus scholarId={scholarId} />
        </Suspense>
      </div>
    </div>
  );
}

export function AdminScholarOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
      <AdminScholarHeaderSkeleton />
      <ScholarBioSectionSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        <ScholarAttendanceSkeleton />
        <ScholarUpcomingSessionsSkeleton />
        <ScholarFeedbackSummarySkeleton />
        <ScholarSubmissionsSkeleton />
        <ScholarCertificateStatusSkeleton />
      </div>
    </div>
  );
}
