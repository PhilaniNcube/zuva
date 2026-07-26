import { Award } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listEligibleCertificates } from "../certificate-queries";
import { AdvanceForm } from "./advance-form";

export async function CertificateAdminList() {
  const certificates = await listEligibleCertificates();

  if (certificates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No certificates awaiting advancement.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Scholar</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Cohort</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {certificates.map((c) => (
          <TableRow key={c.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Award className="size-5" />
                </div>
                <span className="font-medium text-foreground text-sm">{c.scholarName}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{c.scholarEmail}</TableCell>
            <TableCell>{c.cohortName}</TableCell>
            <TableCell className="text-right">
              <AdvanceForm certificateId={c.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CertificateAdminListSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="h-10 w-full animate-pulse rounded-lg bg-muted/60" />
    </div>
  );
}
