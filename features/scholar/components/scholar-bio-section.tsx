import { getScholarProfile } from "@/features/user/user-queries";
import { ScholarBioCard, ScholarBioCardSkeleton } from "./scholar-bio-card";

export async function ScholarBioSection({ scholarId }: { scholarId: string }) {
  const profile = await getScholarProfile(scholarId);

  return (
    <ScholarBioCard
      scholarUserId={scholarId}
      bio={profile?.bio ?? null}
      mtpText={profile?.mtpText ?? null}
      bioReviewedAt={profile?.bioReviewedAt}
      bioRewriteNeeded={profile?.bioRewriteNeeded}
      bioRewriteCompletedAt={profile?.bioRewriteCompletedAt}
    />
  );
}

export { ScholarBioCardSkeleton as ScholarBioSectionSkeleton };
