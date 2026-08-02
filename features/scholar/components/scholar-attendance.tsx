import { CalendarCheck, CheckCircle2 } from "lucide-react";

import { LocalTime } from "@/components/local-time";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getScholarAttendanceStats,
  listScholarAttendedSessions,
} from "@/features/session/session-queries";
import { getScholarProfile } from "@/features/user/user-queries";

export async function ScholarAttendance({ scholarId }: { scholarId: string }) {
  const profile = await getScholarProfile(scholarId);
  const [attended, stats] = await Promise.all([
    listScholarAttendedSessions(scholarId),
    getScholarAttendanceStats(scholarId, profile?.cohortId ?? null),
  ]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-primary" />
          Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {stats.attendedCount}
            </div>
            <div className="text-xs text-muted-foreground">attended</div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {stats.attendanceRate === null ? "—" : `${stats.attendanceRate}%`}
            </div>
            <div className="text-xs text-muted-foreground">
              of {stats.eligibleCompletedCount} past sessions
            </div>
          </div>
        </div>

        {attended.length > 0 ? (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CalendarCheck className="size-3.5" /> Recently attended
            </p>
            <ul className="space-y-2.5">
              {attended.slice(0, 6).map((a) => (
                <li
                  key={a.sessionId}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {a.title}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {a.typeName}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    <LocalTime value={a.startsAt} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ScholarAttendanceSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-6">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}
