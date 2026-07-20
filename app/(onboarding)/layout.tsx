import { redirect } from "next/navigation";

import { getScholarProfile } from "@/features/user/user-queries";
import { requireRole } from "@/lib/rbac";

/**
 * Onboarding lives outside the (scholar) group so the scholar layout's
 * "must have completed onboarding" redirect can't loop back here.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireRole("scholar");
  const profile = await getScholarProfile(user.id);
  if (profile?.onboardingCompletedAt) redirect("/pathway");
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      {children}
    </main>
  );
}
