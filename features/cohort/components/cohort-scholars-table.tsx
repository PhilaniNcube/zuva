"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  UserCheck,
  Clock,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  X,
  MessageCircle,
  ExternalLink,
  Filter,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { DeleteUserDialog } from "@/features/user/components/delete-user-dialog";
import { EditScholarDialog } from "@/features/user/components/edit-scholar-dialog";
import { UnenrollScholarDialog } from "./unenroll-scholar-dialog";
import { waLink } from "@/lib/whatsapp";
import {
  MoreHorizontal,
  User,
  UserPen,
  UserMinus,
  Trash2,
} from "lucide-react";

export interface CohortScholarItem {
  id: string;
  name: string;
  email: string;
  country: string | null;
  degree?: string | null;
  institution?: string | null;
  whatsappNumber?: string | null;
  linkedinUrl?: string | null;
  onboardedAt: Date | string | null;
}

interface CohortScholarsTableProps {
  cohortId: string;
  scholars: CohortScholarItem[];
  totalCount: number;
  pageCount: number;
  page: number;
  pageSize: number;
  country?: string;
  onboardingStatus?: string;
  availableCountries: string[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CohortScholarsTable({
  cohortId,
  scholars,
  totalCount,
  pageCount,
  page: serverPage,
  pageSize: serverPageSize,
  country: serverCountry,
  onboardingStatus: serverOnboardingStatus,
  availableCountries,
}: CohortScholarsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [editingScholar, setEditingScholar] = useState<CohortScholarItem | null>(null);

  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false, startTransition })
  );
  const [pageSize, setPageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(10).withOptions({ shallow: false, startTransition })
  );
  const [country, setCountry] = useQueryState(
    "country",
    parseAsString.withDefault("").withOptions({ shallow: false, startTransition })
  );
  const [onboardingStatus, setOnboardingStatus] = useQueryState(
    "onboardingStatus",
    parseAsString.withDefault("").withOptions({ shallow: false, startTransition })
  );

  const currentPage = page ?? serverPage;
  const currentPageSize = pageSize ?? serverPageSize;
  const currentCountry = country ?? serverCountry ?? "";
  const currentOnboardingStatus = onboardingStatus ?? serverOnboardingStatus ?? "";

  const hasActiveFilters = Boolean(currentCountry || currentOnboardingStatus);

  const columns = useMemo<ColumnDef<CohortScholarItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Scholar",
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex items-center gap-3 py-0.5 min-w-[200px]">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {getInitials(s.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <Link
                  href={`/admin/scholars/${s.id}`}
                  className="font-medium text-foreground text-sm hover:text-primary hover:underline underline-offset-4 transition-colors truncate block"
                >
                  {s.name}
                </Link>
                <div className="text-xs text-muted-foreground truncate">{s.email}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "country",
        header: "Academic Info",
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="space-y-0.5 text-xs">
              <div className="font-medium text-foreground">{s.country ?? "—"}</div>
              {s.institution && (
                <div className="text-muted-foreground font-medium truncate max-w-[180px]" title={s.institution}>
                  {s.institution}
                </div>
              )}
              {s.degree && (
                <div className="text-muted-foreground/80 truncate max-w-[180px]" title={s.degree}>
                  {s.degree}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "contact",
        header: "Contact & Links",
        cell: ({ row }) => {
          const s = row.original;
          const phone = s.whatsappNumber;
          const linkedin = s.linkedinUrl;

          if (!phone && !linkedin) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }

          return (
            <div className="flex flex-wrap items-center gap-2">
              {phone && (
                <a
                  href={waLink(
                    phone,
                    `Hi ${s.name}, reaching out regarding ZUVA programme.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
              )}
              {linkedin && (
                <a
                  href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="size-3.5 shrink-0" />
                  <span>LinkedIn</span>
                </a>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "onboardedAt",
        header: "Status",
        cell: ({ row }) =>
          row.original.onboardedAt ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <UserCheck className="size-3" /> Onboarded
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground border border-border/60">
              <Clock className="size-3" /> Pending
            </span>
          ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const s = row.original;
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
                  <DropdownMenuItem render={<Link href={`/admin/scholars/${s.id}`} />}>
                    <User className="size-3.5 mr-2 text-muted-foreground" />
                    View Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setEditingScholar(s)}
                  >
                    <UserPen className="size-3.5 mr-2 text-muted-foreground" />
                    Edit Details
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <UnenrollScholarDialog
                    scholarId={s.id}
                    scholarName={s.name}
                    cohortId={cohortId}
                    trigger={
                      <DropdownMenuItem variant="default" className="cursor-pointer text-amber-600 dark:text-amber-400">
                        <UserMinus className="size-3.5 mr-2" />
                        Unenroll
                      </DropdownMenuItem>
                    }
                  />

                  <DeleteUserDialog
                    userId={s.id}
                    userName={s.name}
                    userEmail={s.email}
                    trigger={
                      <DropdownMenuItem variant="destructive" className="cursor-pointer">
                        <Trash2 className="size-3.5 mr-2" />
                        Delete Account
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
    [cohortId]
  );

  const table = useReactTable({
    data: scholars,
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
    setCountry(null);
    setOnboardingStatus(null);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Country Filter */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Globe className="size-3.5 text-primary" />
            <span>Country:</span>
          </div>

          <Select
            value={currentCountry || "all"}
            onValueChange={(val) => {
              setCountry(val === "all" ? null : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">All Countries</SelectItem>
              {availableCountries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Onboarding Status Filter */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Filter className="size-3.5 text-primary" />
            <span>Onboarding:</span>
          </div>

          <Select
            value={currentOnboardingStatus || "all"}
            onValueChange={(val) => {
              setOnboardingStatus(val === "all" ? null : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[170px] text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="onboarded">Onboarded</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
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

        {isPending && (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <Loader2 className="size-3.5 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Table Section */}
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
                <TableRow key={row.id}>
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
                  No scholars enrolled matching the criteria.
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
            scholars
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
      {/* Edit Scholar Dialog */}
      {editingScholar && (
        <EditScholarDialog
          scholar={editingScholar}
          open={Boolean(editingScholar)}
          onOpenChange={(open) => {
            if (!open) setEditingScholar(null);
          }}
        />
      )}
    </div>
  );
}
