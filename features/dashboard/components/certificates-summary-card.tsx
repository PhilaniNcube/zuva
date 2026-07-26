import { Award, Clock, Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCertificatesSummary } from "../dashboard-queries";

export async function CertificatesSummaryCard() {
  const data = await getCertificatesSummary();

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Certificates Status
          </CardTitle>
          <div className="mt-1 text-2xl font-bold tracking-tight">
            {data.issued}
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <Award className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
            <Clock className="h-3.5 w-3.5" />
            {data.pendingApproval} pending
          </span>{" "}
          ·{" "}
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {data.eligible} eligible
          </span>
        </CardDescription>
      </CardContent>
    </Card>
  );
}

export function CertificatesSummaryCardSkeleton() {
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
        <Skeleton className="mt-1 h-4 w-36" />
      </CardContent>
    </Card>
  );
}
