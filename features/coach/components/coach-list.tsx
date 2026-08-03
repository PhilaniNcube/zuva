import { listCoachesPaginated } from "../coach-queries";
import { CoachTable } from "./coach-table";

interface CoachListProps {
  page?: number;
  pageSize?: number;
  search?: string;
  specialty?: string;
}

export async function CoachList({
  page = 1,
  pageSize = 10,
  search,
  specialty,
}: CoachListProps) {
  const { coaches, totalCount, pageCount } = await listCoachesPaginated({
    page,
    pageSize,
    search,
    specialty,
  });

  return (
    <CoachTable
      data={coaches}
      totalCount={totalCount}
      pageCount={pageCount}
      page={page}
      pageSize={pageSize}
      search={search}
      specialty={specialty}
    />
  );
}

export function CoachListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-14 rounded-lg border bg-card p-3 animate-pulse" />
      <div className="rounded-md border p-4 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-muted/60"
          />
        ))}
      </div>
    </div>
  );
}
