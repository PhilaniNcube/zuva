import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Availability" };

import {
  CoachSessions,
  CoachSessionsSkeleton,
} from "@/features/session/components/coach-sessions";
import {
  CoachSlots,
  CoachSlotsSkeleton,
} from "@/features/session/components/coach-slots";
import { SlotPublishForm } from "@/features/session/components/slot-publish-form";
import { requireRole } from "@/lib/rbac";

export default async function AvailabilityPage() {
  const { user } = await requireRole("coach");
  return (
    <main className="flex min-h-screen flex-col gap-8 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My availability</h1>
          <p className="text-sm text-zinc-500">
            Publish 1:1 slots for scholars to book, and join your calls from
            here.
          </p>
        </div>
        <SlotPublishForm />
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">My 1:1 slots</h2>
        <Suspense fallback={<CoachSlotsSkeleton />}>
          <CoachSlots coachId={user.id} />
        </Suspense>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">My group sessions</h2>
        <Suspense fallback={<CoachSessionsSkeleton />}>
          <CoachSessions coachId={user.id} />
        </Suspense>
      </section>
    </main>
  );
}
