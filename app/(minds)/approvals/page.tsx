import { Suspense } from "react";
import type { Metadata } from "next";

import {
  CertificateApprovalList,
  CertificateApprovalListSkeleton,
} from "@/features/certificate/components/certificate-approval-list";
import { requireRole } from "@/lib/rbac";

export const metadata: Metadata = { title: "Certificate Approvals" };

export default async function ApprovalsPage() {
  const { user } = await requireRole("minds");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Certificate Approvals</h1>
      <p className="text-sm text-zinc-500">
        Signed in as {user.name} ({user.email})
      </p>

      <Suspense fallback={<CertificateApprovalListSkeleton />}>
        <CertificateApprovalList />
      </Suspense>
    </div>
  );
}
