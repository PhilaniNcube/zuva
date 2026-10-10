import { Button } from "@/components/ui/button";
import { getCoachDetail } from "../coach-queries";
import { CoachSyncButton } from "./coach-sync-button";
import { CoachWeeklySchedule } from "./coach-weekly-schedule";
import { CoachWorkingHoursDialog } from "./coach-working-hours-dialog";

/**
 * A coach's own schedule, rendered with the same weekly calendar grid the
 * admin coach-detail page uses — but wired to coach-scoped controls rather
 * than the admin-only dialogs.
 */
export async function CoachScheduleCalendar({ coachId }: { coachId: string }) {
  const coach = await getCoachDetail(coachId);

  if (!coach) {
    return (
      <p className="text-sm text-muted-foreground">
        No coach profile found for this account.
      </p>
    );
  }

  return (
    <CoachWeeklySchedule
      coachUserId={coach.id}
      coachName={coach.name}
      workingHours={coach.workingHours}
      slots={coach.slots}
      sessions={coach.sessions}
      icalBusyBlocks={coach.icalBusyBlocks}
      icalUrl={coach.icalUrl}
      lastSyncedAt={coach.lastSyncedAt}
      headerActions={
        <>
          <CoachWorkingHoursDialog workingHours={coach.workingHours} />
          <CoachSyncButton disabled={!coach.icalUrl} />
        </>
      }
      bannerAction={
        <CoachWorkingHoursDialog
          workingHours={coach.workingHours}
          trigger={
            <Button
              size="sm"
              className="bg-amber-700 text-white hover:bg-amber-800 font-medium text-xs"
            >
              Set Working Hours Now
            </Button>
          }
        />
      }
      bannerDescription="You haven't set your weekly working hours yet. Configure them to generate bookable 1:1 slots."
    />
  );
}

export function CoachScheduleCalendarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-16 animate-pulse rounded-xl bg-muted/60" />
      <div className="h-[420px] animate-pulse rounded-xl bg-muted/60" />
    </div>
  );
}
