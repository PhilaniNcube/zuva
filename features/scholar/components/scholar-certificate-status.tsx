import { Award } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCertificateStatus } from "@/features/certificate/certificate-queries";

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  eligible: "Eligible for review",
  pending_approval: "Pending MINDS approval",
  issued: "Certificate issued",
};

const STATUS_STYLES: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground border border-border/60",
  in_progress: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20",
  eligible: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
  pending_approval: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20",
  issued: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
};

export async function ScholarCertificateStatus({
  scholarId,
}: {
  scholarId: string;
}) {
  const cert = await getCertificateStatus(scholarId);
  const pct = Math.min(100, (cert.feedbackCount / cert.threshold) * 100);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="size-4 text-primary" />
          Certificate
          <span
            className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[cert.status] ?? "bg-muted text-muted-foreground border border-border/60"}`}
          >
            {STATUS_LABELS[cert.status] ?? cert.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Feedback forms</span>
          <span>
            {cert.feedbackCount} / {cert.threshold}
          </span>
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {cert.adminNote ? (
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Admin note:</span>{" "}
            {cert.adminNote}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ScholarCertificateStatusSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full rounded-full" />
      </CardContent>
    </Card>
  );
}
