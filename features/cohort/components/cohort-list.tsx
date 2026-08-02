import { listCohortsPaginated } from "../cohort-queries";
import { CohortTable } from "./cohort-table";

interface CohortListProps {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

export async function CohortList({
  page = 1,
  pageSize = 10,
  startDate,
  endDate,
}: CohortListProps = {}) {
  const { data, totalCount, pageCount } = await listCohortsPaginated({
    page,
    pageSize,
    startDate,
    endDate,
  });

  return (
    <CohortTable
      data={data}
      totalCount={totalCount}
      pageCount={pageCount}
      page={page}
      pageSize={pageSize}
      startDate={startDate}
      endDate={endDate}
    />
  );
}

export function CohortListSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded-lg bg-muted/60"
        />
      ))}
    </div>
  );
}
