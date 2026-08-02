import { CalendarDays } from "lucide-react";

import { LocalTime } from "@/components/local-time";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listScholarUpcomingSessions } from "@/features/session/session-queries";
import { getScholarProfile } from "@/features/user/user-queries";

export async function ScholarUpcomingSessions({
  scholarId,
}: {
  scholarId: string;
}) {
  const profile = await getScholarProfile(scholarId);
  const sessions = await listScholarUpcomingSessions(
    scholarId,
    profile?.cohortId ?? null,
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          Upcoming sessions
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
            {sessions.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming sessions scheduled.
          </p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {s.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                    {s.typeName}
                    {s.coachName ? ` · ${s.coachName}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  <LocalTime value={s.startsAt} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function ScholarUpcomingSessionsSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </CardContent>
    </Card>
  );
}
