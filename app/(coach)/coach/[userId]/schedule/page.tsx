import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/rbac";
import {
  CoachSessions,
  CoachSessionsSkeleton,
} from "@/features/session/components/coach-sessions";
import {
  CoachSlots,
  CoachSlotsSkeleton,
} from "@/features/session/components/coach-slots";

export const metadata: Metadata = { title: "Coach Schedule" };

export default async function CoachSchedulePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { user } = await requireRole("coach");

  // Coach can only view their own schedule unless admin
  if (user.role !== "admin" && user.id !== userId) {
    redirect(`/coach/${user.id}/schedule`);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Coach Schedule</h1>
        <p className="text-sm text-zinc-500">
          View your upcoming group sessions, masterclasses, and 1-on-1 bookings.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">1-on-1 Bookings & Availability</h2>
        <Suspense fallback={<CoachSlotsSkeleton />}>
          <CoachSlots coachId={userId} />
        </Suspense>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Group Sessions & Masterclasses</h2>
        <Suspense fallback={<CoachSessionsSkeleton />}>
          <CoachSessions coachId={userId} />
        </Suspense>
      </section>
    </div>
  );
}
