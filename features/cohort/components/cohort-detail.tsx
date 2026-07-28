import { notFound } from "next/navigation";
import { UserCheck, Clock } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteUserDialog } from "@/features/user/components/delete-user-dialog";
import { getCohort, listCohortScholars } from "../cohort-queries";
import { CohortEditForm } from "./cohort-edit-form";
import { DeleteCohortDialog } from "./delete-cohort-dialog";
import { ScholarEnrollForm } from "./scholar-enroll-form";
import { UnenrollScholarDialog } from "./unenroll-scholar-dialog";

export async function CohortDetail({ id }: { id: Promise<string> }) {
  const cohortId = await id;
  const [cohort, scholars] = await Promise.all([
    getCohort(cohortId),
    listCohortScholars(cohortId),
  ]);
  if (!cohort) notFound();

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{cohort.name}</h1>
            <p className="text-sm text-muted-foreground">
              {cohort.status} · starts{" "}
              {cohort.startsAt.toLocaleDateString("en-GB", { timeZone: "UTC" })}
              {cohort.endsAt
                ? ` · ends ${cohort.endsAt.toLocaleDateString("en-GB", { timeZone: "UTC" })}`
                : ""}
            </p>
          </div>
          <DeleteCohortDialog
            cohortId={cohort.id}
            cohortName={cohort.name}
            redirectOnSuccess
          />
        </div>
        <CohortEditForm
          cohortId={cohort.id}
          initial={{
            name: cohort.name,
            startsAt: toDateInputValue(cohort.startsAt),
            endsAt: cohort.endsAt ? toDateInputValue(cohort.endsAt) : "",
            status: cohort.status,
          }}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Scholars ({scholars.length})
          </h2>
          <ScholarEnrollForm cohortId={cohort.id} />
        </div>

        {scholars.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No scholars enrolled yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scholar</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Onboarding Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scholars.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {getInitials(s.name)}
                      </div>
                      <span className="font-medium text-foreground">{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.email}</TableCell>
                  <TableCell>{s.country ?? "—"}</TableCell>
                  <TableCell>
                    {s.onboardedAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <UserCheck className="size-3" /> Onboarded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground border border-border/60">
                        <Clock className="size-3" /> Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <UnenrollScholarDialog
                        scholarId={s.id}
                        scholarName={s.name}
                        cohortId={cohort.id}
                      />
                      <DeleteUserDialog
                        userId={s.id}
                        userName={s.name}
                        userEmail={s.email}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}

export function CohortDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="h-16 animate-pulse rounded-xl bg-muted/60" />
      <div className="h-48 animate-pulse rounded-xl bg-muted/60" />
    </div>
  );
}

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
