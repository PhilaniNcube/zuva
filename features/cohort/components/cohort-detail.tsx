import { notFound } from "next/navigation";
import { format } from "date-fns";

import { getCohort, listCohortScholarsPaginated } from "../cohort-queries";
import { CohortEditForm } from "./cohort-edit-form";
import { CohortScholarsTable } from "./cohort-scholars-table";
import { DeleteCohortDialog } from "./delete-cohort-dialog";
import { ScholarEnrollForm } from "./scholar-enroll-form";

interface CohortDetailProps {
  id: Promise<string>;
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
  const cohortId = await id;
  const [cohort, scholarData] = await Promise.all([
    getCohort(cohortId),
    listCohortScholarsPaginated({
      cohortId,
      page,
      pageSize,
      country,
      onboardingStatus,
    }),
  ]);
  if (!cohort) notFound();

  const { scholars, totalCount, pageCount, availableCountries } = scholarData;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{cohort.name}</h1>
            <p className="text-sm text-muted-foreground">
              {cohort.status} · starts {format(cohort.startsAt, "dd MMM yyyy")}
              {cohort.endsAt
                ? ` · ends ${format(cohort.endsAt, "dd MMM yyyy")}`
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
            Scholars ({totalCount})
          </h2>
          <ScholarEnrollForm cohortId={cohort.id} />
        </div>

        <CohortScholarsTable
          cohortId={cohort.id}
          scholars={scholars}
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

function toDateInputValue(d: Date) {
  return format(d, "yyyy-MM-dd");
}
