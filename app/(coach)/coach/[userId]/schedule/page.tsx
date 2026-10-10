import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/rbac";
import {
  CoachScheduleCalendar,
  CoachScheduleCalendarSkeleton,
} from "@/features/coach/components/coach-schedule-calendar";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Coach Schedule</h1>
        <p className="text-sm text-muted-foreground">
          Your weekly calendar of 1:1 availability, booked coaching sessions,
          and group masterclasses.
        </p>
      </div>

      <Suspense fallback={<CoachScheduleCalendarSkeleton />}>
        <CoachScheduleCalendar coachId={userId} />
      </Suspense>
    </div>
  );
}
