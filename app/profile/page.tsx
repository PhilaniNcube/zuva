import { Suspense } from "react";
import type { Metadata } from "next";

import {
  ProfileContent,
  ProfileContentSkeleton,
} from "@/features/user/components/profile-content";

export const metadata: Metadata = { title: "Profile | ZUVA Scholar Hub" };

export default function ProfilePage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <Suspense fallback={<ProfileContentSkeleton />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
