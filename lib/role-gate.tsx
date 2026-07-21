import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getScholarProfile } from "@/features/user/user-queries";
import { requireRole } from "./rbac";

async function AdminGateInner({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  return <main className="p-6">{children}</main>;
}

async function ScholarGateInner({ children }: { children: React.ReactNode }) {
  const { user } = await requireRole("scholar");
  const profile = await getScholarProfile(user.id);
  if (!profile?.onboardingCompletedAt) redirect("/onboarding");
  return <>{children}</>;
}

async function OnboardingGateInner({ children }: { children: React.ReactNode }) {
  const { user } = await requireRole("scholar");
  const profile = await getScholarProfile(user.id);
  if (profile?.onboardingCompletedAt) redirect("/pathway");
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      {children}
    </main>
  );
}

function LoadingSkeleton() {
  return <div className="p-6 text-sm text-zinc-500">Loading…</div>;
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AdminGateInner>{children}</AdminGateInner>
    </Suspense>
  );
}

export function CoachGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RoleGate role="coach">{children}</RoleGate>
    </Suspense>
  );
}

export function MindsGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RoleGate role="minds">{children}</RoleGate>
    </Suspense>
  );
}

export function ScholarGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ScholarGateInner>{children}</ScholarGateInner>
    </Suspense>
  );
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <OnboardingGateInner>{children}</OnboardingGateInner>
    </Suspense>
  );
}

async function RoleGate({
  role,
  children,
}: {
  role: "coach" | "minds";
  children: React.ReactNode;
}) {
  await requireRole(role);
  return <>{children}</>;
}
