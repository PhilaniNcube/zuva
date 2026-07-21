import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

import {
  CertificateAdminList,
  CertificateAdminListSkeleton,
} from "@/features/certificate/components/certificate-admin-list";
import { requireRole } from "@/lib/rbac";

export default async function AdminDashboardPage() {
  const { user } = await requireRole("admin");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Programme Dashboard</h1>
      <p className="text-sm text-zinc-500">Signed in as {user.name}.</p>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Certificates</h2>
        <Suspense fallback={<CertificateAdminListSkeleton />}>
          <CertificateAdminList />
        </Suspense>
      </section>
    </div>
  );
}
