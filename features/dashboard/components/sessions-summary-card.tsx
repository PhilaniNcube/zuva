import { CalendarDays, UserCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionsSummary } from "../dashboard-queries";

export async function SessionsSummaryCard() {
  const data = await getSessionsSummary();

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Programme Sessions
          </CardTitle>
          <div className="mt-1 text-2xl font-bold tracking-tight">
            {data.totalSessions}
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <CalendarDays className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            {data.upcomingSessions}
          </span>{" "}
          upcoming ·{" "}
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <UserCheck className="h-3.5 w-3.5 text-blue-500" />
            {data.activeCoaches} active {data.activeCoaches === 1 ? "coach" : "coaches"}
          </span>
        </CardDescription>
      </CardContent>
    </Card>
  );
}

export function SessionsSummaryCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mt-1 h-4 w-40" />
      </CardContent>
    </Card>
  );
}
