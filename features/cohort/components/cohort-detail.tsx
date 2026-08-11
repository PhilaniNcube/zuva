import { notFound } from "next/navigation";
import { format, isValid } from "date-fns";
import { History, Calendar } from "lucide-react";

import { getCohort, listCohortScholarsPaginated, listCohorts } from "../cohort-queries";
import { CohortEditForm } from "./cohort-edit-form";
import { CohortScholarsTable } from "./cohort-scholars-table";
import { DeleteCohortDialog } from "./delete-cohort-dialog";
import { ScholarEnrollForm } from "./scholar-enroll-form";
import { ScholarBulkEnrollForm } from "./scholar-bulk-enroll-form";

interface CohortDetailProps {
  id: string | Promise<string>;
  page?: number;
  pageSize?: number;
  country?: string;
  onboardingStatus?: string;
}

export async function CohortDetail({
  id,
  page = 1,
  pageSize = 10,
  country,
  onboardingStatus,
}: CohortDetailProps) {
  const cohortId = typeof id === "string" ? id : await id;
  const [cohort, scholarData, cohorts] = await Promise.all([
    getCohort(cohortId),
    listCohortScholarsPaginated({
      cohortId,
      page,
      pageSize,
      country,
      onboardingStatus,
    }),
    listCohorts(),
  ]);
  if (!cohort) notFound();

  const { scholars, totalCount, pageCount, availableCountries } = scholarData;
  const isHistorical =
    cohort.status === "completed" ||
    (cohort.endsAt ? new Date(cohort.endsAt) < new Date() : false);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{cohort.name}</h1>
              {isHistorical ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <History className="size-3.5 text-amber-600 dark:text-amber-400" />
                  Historical Intake
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <Calendar className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  Active Intake
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {cohort.status} · starts {formatDate(cohort.startsAt)}
              {cohort.endsAt ? ` · ends ${formatDate(cohort.endsAt)}` : ""}
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
        {isHistorical && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 border border-amber-500/20">
            <History className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong className="font-semibold">Historical Data Entry Mode:</strong> Notifications to scholars and coaches are suppressed by default when enrolling scholars in this historical cohort.
            </span>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Scholars ({totalCount})
          </h2>
          <div className="flex items-center gap-2">
            <ScholarEnrollForm
              cohortId={cohort.id}
              cohortStatus={cohort.status}
              isHistorical={isHistorical}
            />
            <ScholarBulkEnrollForm
              cohortId={cohort.id}
              cohortStatus={cohort.status}
              isHistorical={isHistorical}
            />
          </div>
        </div>

        <CohortScholarsTable
          cohortId={cohort.id}
          scholars={scholars}
          cohorts={cohorts}
          totalCount={totalCount}
          pageCount={pageCount}
          page={page}
          pageSize={pageSize}
          country={country}
          onboardingStatus={onboardingStatus}
          availableCountries={availableCountries}
        />
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

function formatDate(d: Date | string | number | null | undefined) {
  if (!d) return "";
  const parsed = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  if (!isValid(parsed)) return "";
  return format(parsed, "dd MMM yyyy");
}

function toDateInputValue(d: Date | string | number | null | undefined) {
  if (!d) return "";
  const parsed = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  if (!isValid(parsed)) return "";
  return format(parsed, "yyyy-MM-dd");
}
