"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  X,
  Loader2,
  MoreHorizontal,
  Eye,
  Trash2,
} from "lucide-react";

import { format, isValid, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteCohortDialog } from "./delete-cohort-dialog";

export interface CohortItem {
  id: string;
  name: string;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  status: string;
  scholarCount: number;
}

interface CohortTableProps {
  data: CohortItem[];
  totalCount: number;
  pageCount: number;
  page: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border border-border/60",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
  completed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
};

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const parsed = typeof d === "string" ? parseISO(d) : new Date(d);
  if (!isValid(parsed)) return "—";
  return (
    <span suppressHydrationWarning>
      {format(parsed, "dd MMM yyyy")}
    </span>
  );
}

export function CohortTable({
  data,
  totalCount,
  pageCount,
  page: serverPage,
  pageSize: serverPageSize,
  startDate: serverStartDate,
  endDate: serverEndDate,
}: CohortTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false, startTransition })
  );
  const [pageSize, setPageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(10).withOptions({ shallow: false, startTransition })
  );
  const [startDate, setStartDate] = useQueryState(
    "startDate",
    parseAsString.withDefault("").withOptions({ shallow: false, startTransition })
  );
  const [endDate, setEndDate] = useQueryState(
    "endDate",
    parseAsString.withDefault("").withOptions({ shallow: false, startTransition })
  );

  const currentPage = page ?? serverPage;
  const currentPageSize = pageSize ?? serverPageSize;
  const currentStartDate = startDate ?? serverStartDate ?? "";
  const currentEndDate = endDate ?? serverEndDate ?? "";

  const hasDateFilter = Boolean(currentStartDate || currentEndDate);

  const columns = useMemo<ColumnDef<CohortItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Cohort Name",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex items-center gap-3 py-1">

              <div>
                <Link
                  href={`/cohorts/${c.id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors text-sm"
                >
                  {c.name}
                </Link>
                <p className="text-xs text-muted-foreground">Academic Cohort</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "startsAt",
        header: "Dates",
        cell: ({ row }) => (
          <div className="text-xs space-y-0.5">
            <span className="text-foreground font-medium">{formatDate(row.original.startsAt)}</span>
            <span className="text-muted-foreground block text-[11px]">
              to {formatDate(row.original.endsAt)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.draft
                }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "scholarCount",
        header: "Scholars",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-4 text-primary" />
            <span className="font-medium text-foreground">
              {row.original.scholarCount}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem render={<Link href={`/cohorts/${c.id}`} />}>
                    <Eye className="size-3.5 mr-2 text-muted-foreground" />
                    View Details
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DeleteCohortDialog
                    cohortId={c.id}
                    cohortName={c.name}
                    trigger={
                      <DropdownMenuItem variant="destructive" className="cursor-pointer">
                        <Trash2 className="size-3.5 mr-2" />
                        Delete Cohort
                      </DropdownMenuItem>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination: {
        pageIndex: Math.max(0, currentPage - 1),
        pageSize: currentPageSize,
      },
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Date Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Calendar className="size-3.5 text-primary" />
            <span>Start Date Range:</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">From</span>
              <input
                type="date"
                value={currentStartDate}
                onChange={(e) => {
                  setStartDate(e.target.value || null);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">To</span>
              <input
                type="date"
                value={currentEndDate}
                onChange={(e) => {
                  setEndDate(e.target.value || null);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {hasDateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 size-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {isPending && (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <Loader2 className="size-3.5 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Table Section with Pending Loading Bar */}
      <div className="relative rounded-md border overflow-hidden">
        {isPending && (
          <div className="absolute top-0 left-0 right-0 h-1 z-20 overflow-hidden bg-primary/10">
            <div className="h-full bg-primary animate-pulse w-full" />
          </div>
        )}
        <Table className={isPending ? "opacity-75 transition-opacity" : ""}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (
                      target.closest(
                        "button, a, [role='dialog'], [role='menuitem'], input, select, textarea"
                      )
                    ) {
                      return;
                    }
                    router.push(`/cohorts/${row.original.id}`);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No cohorts found matching the selected criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-2">
          <div className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(currentPage - 1) * currentPageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * currentPageSize, totalCount)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{totalCount}</span>{" "}
            cohorts
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Rows per page
              </span>
              <Select
                value={String(currentPageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={String(currentPageSize)} />
                </SelectTrigger>
                <SelectContent align="end">
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs font-medium text-muted-foreground">
              Page {currentPage} of {pageCount}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(1)}
                disabled={currentPage <= 1}
              >
                <ChevronsLeft className="size-4" />
                <span className="sr-only">First page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="size-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= pageCount}
              >
                <ChevronRight className="size-4" />
                <span className="sr-only">Next page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(pageCount)}
                disabled={currentPage >= pageCount}
              >
                <ChevronsRight className="size-4" />
                <span className="sr-only">Last page</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
