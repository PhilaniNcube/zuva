import { OnboardingWizard } from "@/features/user/components/onboarding-wizard";
import { getScholarProfile } from "@/features/user/user-queries";
import { requireRole } from "@/lib/rbac";

export default async function OnboardingPage() {
  const { user } = await requireRole("scholar");
  const profile = await getScholarProfile(user.id);

  return (
    <OnboardingWizard
      initial={{
        country: profile?.country ?? "",
        whatsappNumber: profile?.whatsappNumber ?? "",
        bio: profile?.bio ?? "",
        mtpText: profile?.mtpText ?? "",
      }}
    />
  );
}
