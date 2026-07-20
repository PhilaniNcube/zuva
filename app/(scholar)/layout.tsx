import { redirect } from "next/navigation";

import { getScholarProfile } from "@/features/user/user-queries";
import { requireRole } from "@/lib/rbac";

export default async function ScholarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireRole("scholar");
  const profile = await getScholarProfile(user.id);
  // First-login scholars must complete onboarding before anything else.
  if (!profile?.onboardingCompletedAt) redirect("/onboarding");
  return <>{children}</>;
}
