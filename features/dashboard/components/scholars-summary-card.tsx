import { GraduationCap, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getScholarsSummary } from "../dashboard-queries";

export async function ScholarsSummaryCard() {
  const data = await getScholarsSummary();

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Scholars & Cohorts
          </CardTitle>
          <div className="mt-1 text-2xl font-bold tracking-tight">
            {data.totalScholars}
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GraduationCap className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Users className="h-3.5 w-3.5 text-primary" />
            {data.onboardedScholars}
          </span>{" "}
          onboarded ·{" "}
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {data.activeCohorts} active {data.activeCohorts === 1 ? "cohort" : "cohorts"}
          </span>
        </CardDescription>
      </CardContent>
    </Card>
  );
}

export function ScholarsSummaryCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mt-1 h-4 w-36" />
      </CardContent>
    </Card>
  );
}
