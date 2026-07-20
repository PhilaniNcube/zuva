import { Suspense } from "react";

import {
  BookingBrowser,
  BookingBrowserSkeleton,
} from "@/features/session/components/booking-browser";
import {
  CohortSessions,
  CohortSessionsSkeleton,
} from "@/features/session/components/cohort-sessions";
import {
  MyBookings,
  MyBookingsSkeleton,
} from "@/features/session/components/my-bookings";
import { getScholarProfile } from "@/features/user/user-queries";
import { requireRole } from "@/lib/rbac";

export default async function SessionsPage() {
  const { user } = await requireRole("scholar");
  const profile = await getScholarProfile(user.id);

  return (
    <main className="flex min-h-screen flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Sessions</h1>
        <p className="text-sm text-zinc-500">
          Masterclasses and orientations for your cohort, plus your 1:1
          coaching bookings.
        </p>
      </div>

      {profile?.cohortId ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Cohort sessions</h2>
          <Suspense fallback={<CohortSessionsSkeleton />}>
            <CohortSessions cohortId={profile.cohortId} />
          </Suspense>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">My 1:1 bookings</h2>
        <Suspense fallback={<MyBookingsSkeleton />}>
          <MyBookings scholarId={user.id} />
        </Suspense>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Book a 1:1</h2>
        <Suspense fallback={<BookingBrowserSkeleton />}>
          <BookingBrowser />
        </Suspense>
      </section>
    </main>
  );
}
