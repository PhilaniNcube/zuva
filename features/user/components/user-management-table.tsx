"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, useTransition, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { format, isValid, parseISO } from "date-fns";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPen,
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
  CheckCircle2,
  FileText,
} from "lucide-react";

import { promoteUserToAdmin } from "@/features/user/user-actions";
import { DeleteUserDialog } from "./delete-user-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/action-result";
import type { Role } from "@/lib/roles";
import { waLink } from "@/lib/whatsapp";
import { EditScholarDialog, type CohortOption } from "./edit-scholar-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  User,
  Trash2,
} from "lucide-react";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  image: string | null;
  cohorts?: { id: string; name: string }[];
  cohortId?: string | null;
  country?: string | null;
  degree?: string | null;
  institution?: string | null;
  whatsappNumber?: string | null;
  linkedinUrl?: string | null;
  onboardedAt?: Date | string | null;
  bioReviewedAt?: Date | string | null;
  bioRewriteNeeded?: boolean | null;
  bioRewriteCompletedAt?: Date | string | null;
  createdAt: Date | string;
}

interface UserManagementTableProps {
  users: UserItem[];
  cohorts?: CohortOption[];
  totalCount?: number;
  pageCount?: number;
  page?: number;
  pageSize?: number;
  country?: string;
  role?: string;
  search?: string;
  onboardingStatus?: string;
  availableCountries?: string[];
  currentUserId: string;
}

const promoteSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

type PromoteFormValues = z.infer<typeof promoteSchema>;

async function promoteAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  return promoteUserToAdmin({
    userId: formData.get("userId"),
  });
}

function PromoteAdminDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(promoteAction, null);

  const form = useForm<PromoteFormValues>({
    resolver: zodResolver(promoteSchema),
    values: {
      userId: user?.id ?? "",
    },
  });

  useEffect(() => {
    if (state?.ok && user) {
      toast.success(`${user.name} has been promoted to Admin`);
      onOpenChange(false);
    }
    if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state, user, onOpenChange]);

  if (!user) return null;

  function onSubmit(data: PromoteFormValues) {
    const formData = new FormData();
    formData.set("userId", data.userId);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-500" />
            Confirm Admin Promotion
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to promote <strong>{user.name}</strong> (
            {user.email}) to the <strong>Admin</strong> role? Admins have full
            access to platform settings and management.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("userId")} />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Promoting…" : "Promote User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRoleBadgeVariant(role: Role) {
  switch (role) {
    case "admin":
      return "default";
    case "coach":
      return "secondary";
    case "minds":
      return "outline";
    default:
      return "outline";
  }
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const parsed = typeof d === "string" ? parseISO(d) : new Date(d);
  if (!isValid(parsed)) return "—";
  return <span suppressHydrationWarning>{format(parsed, "MMM d, yyyy")}</span>;
}

export function UserManagementTable({
  users,
  cohorts = [],
  totalCount = users.length,
  pageCount = 1,
  page: serverPage = 1,
  pageSize: serverPageSize = 10,
  country: serverCountry,
  role: serverRole,
  search: serverSearch,
  onboardingStatus: serverOnboardingStatus,
  availableCountries = [],
  currentUserId,
}: UserManagementTableProps) {
  const [isPending, startTransition] = useTransition();
  const [editingScholar, setEditingScholar] = useState<UserItem | null>(null);
  const [promotingUser, setPromotingUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

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
  const [roleFilter, setRoleFilter] = useQueryState(
    "role",
    parseAsString.withDefault("").withOptions({ shallow: false, startTransition })
  );
  const [searchFilter, setSearchFilter] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions({ shallow: false, startTransition })
  );
  const [onboardingStatus, setOnboardingStatus] = useQueryState(
    "onboardingStatus",
    parseAsString.withDefault("").withOptions({ shallow: false, startTransition })
  );

  const currentPage = page ?? serverPage;
  const currentPageSize = pageSize ?? serverPageSize;
  const currentCountry = country ?? serverCountry ?? "";
  const currentRole = roleFilter ?? serverRole ?? "";
  const currentSearch = searchFilter ?? serverSearch ?? "";
  const currentOnboardingStatus = onboardingStatus ?? serverOnboardingStatus ?? "";

  const hasActiveFilters = Boolean(
    currentCountry || currentRole || currentSearch || currentOnboardingStatus
  );

  const columns = useMemo<ColumnDef<UserItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "User & Role",
        cell: ({ row }) => {
          const u = row.original;
          const isSelf = u.id === currentUserId;
          const isAdmin = u.role === "admin";
          return (
            <div className="flex items-center gap-3 min-w-[200px]">
              <Avatar className="size-9 shrink-0">
                {u.image ? <AvatarImage src={u.image} alt={u.name} /> : null}
                <AvatarFallback className="text-xs font-semibold">
                  {getInitials(u.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {u.role === "scholar" ? (
                    <Link
                      href={`/admin/scholars/${u.id}`}
                      className="font-medium text-foreground text-sm hover:text-primary hover:underline underline-offset-4 transition-colors truncate"
                    >
                      {u.name} {isSelf && "(You)"}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground text-sm truncate">
                      {u.name} {isSelf && "(You)"}
                    </span>
                  )}
                  <Badge
                    variant={getRoleBadgeVariant(u.role)}
                    className="capitalize text-[11px] px-2 py-0 h-4.5 rounded-full font-medium"
                  >
                    {isAdmin && <ShieldCheck className="mr-1 size-2.5" />}
                    {u.role}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
              </div>
            </div>
          );
        },
      },
      {
        id: "academicLocation",
        header: "Academic & Location",
        cell: ({ row }) => {
          const u = row.original;
          if (!u.country && !u.institution && !u.degree) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <div className="space-y-0.5 text-xs max-w-[220px]">
              {u.country && (
                <div className="font-medium text-foreground">{u.country}</div>
              )}
              {u.institution && (
                <div
                  className="text-muted-foreground font-medium truncate"
                  title={u.institution}
                >
                  {u.institution}
                </div>
              )}
              {u.degree && (
                <div
                  className="text-muted-foreground/80 truncate"
                  title={u.degree}
                >
                  {u.degree}
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
          const u = row.original;
          const phone = u.whatsappNumber;
          const linkedin = u.linkedinUrl;

          if (!phone && !linkedin) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }

          const waHref = phone
            ? waLink(
                phone,
                `Hi ${u.name}, reaching out regarding ZUVA programme.`
              )
            : null;
          const linkedinHref = linkedin
            ? linkedin.startsWith("http")
              ? linkedin
              : `https://${linkedin}`
            : null;

          return (
            <div className="flex flex-col gap-1 text-xs">
              {phone && waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{phone}</span>
                </a>
              )}
              {linkedin && linkedinHref && (
                <a
                  href={linkedinHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="size-3.5 shrink-0" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
            </div>
          );
        },
      },
      {
        id: "statusAndJoined",
        header: "Status & Joined",
        cell: ({ row }) => {
          const u = row.original;
          const isScholar = u.role === "scholar";

          return (
            <div className="space-y-1 text-xs">
              {isScholar ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {u.onboardedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <UserCheck className="size-3" /> Onboarded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
                      <Clock className="size-3" /> Pending
                    </span>
                  )}
                  {u.bioRewriteCompletedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                      <CheckCircle2 className="size-3" /> Rewritten
                    </span>
                  ) : u.bioReviewedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="size-3" /> Reviewed
                    </span>
                  ) : u.bioRewriteNeeded ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                      <FileText className="size-3" /> Rewrite Needed
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="text-muted-foreground">
                Joined {formatDate(u.createdAt)}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
          const u = row.original;
          const isSelf = u.id === currentUserId;
          const isAdmin = u.role === "admin";
          const isScholar = u.role === "scholar";

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
                <DropdownMenuContent align="end" className="w-48">
                  {isScholar && (
                    <DropdownMenuItem render={<Link href={`/admin/scholars/${u.id}`} />}>
                      <User className="size-3.5 mr-2 text-muted-foreground" />
                      View Profile
                    </DropdownMenuItem>
                  )}

                  {isScholar && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => setEditingScholar(u)}
                    >
                      <UserPen className="size-3.5 mr-2 text-muted-foreground" />
                      Edit Details
                    </DropdownMenuItem>
                  )}

                  {!isAdmin && !isScholar && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => setPromotingUser(u)}
                    >
                      <UserCheck className="size-3.5 mr-2 text-muted-foreground" />
                      Promote to Admin
                    </DropdownMenuItem>
                  )}

                  {!isSelf && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={() => setDeletingUser(u)}
                      >
                        <Trash2 className="size-3.5 mr-2" />
                        Delete Account
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [currentUserId]
  );

  const table = useReactTable({
    data: users,
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
    setRoleFilter(null);
    setSearchFilter(null);
    setOnboardingStatus(null);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={currentSearch}
              onChange={(e) => {
                setSearchFilter(e.target.value || null);
                setPage(1);
              }}
              placeholder="Search name or email..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Country Filter */}
          <div className="flex items-center gap-1.5">
            <Globe className="size-3.5 text-muted-foreground" />
            <Select
              value={currentCountry || "all"}
              onValueChange={(val) => {
                setCountry(val === "all" ? null : val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs">
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
          </div>

          {/* Role Filter */}
          <Select
            value={currentRole || "all"}
            onValueChange={(val) => {
              setRoleFilter(val === "all" ? null : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="scholar">Scholar</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="minds">MINDS</SelectItem>
            </SelectContent>
          </Select>

          {/* Onboarding Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-muted-foreground" />
            <Select
              value={currentOnboardingStatus || "all"}
              onValueChange={(val) => {
                setOnboardingStatus(val === "all" ? null : val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="onboarded">Onboarded</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

      {/* Users Table */}
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
                    <TableCell key={cell.id} className="py-4">
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
                  No users found matching the selected criteria.
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
            users
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
          cohorts={cohorts}
          open={Boolean(editingScholar)}
          onOpenChange={(open) => {
            if (!open) setEditingScholar(null);
          }}
        />
      )}

      {/* Promote to Admin Dialog */}
      {promotingUser && (
        <PromoteAdminDialog
          user={promotingUser}
          open={Boolean(promotingUser)}
          onOpenChange={(open) => {
            if (!open) setPromotingUser(null);
          }}
        />
      )}

      {/* Delete User Dialog */}
      {deletingUser && (
        <DeleteUserDialog
          userId={deletingUser.id}
          userName={deletingUser.name}
          userEmail={deletingUser.email}
          open={Boolean(deletingUser)}
          onOpenChange={(open) => {
            if (!open) setDeletingUser(null);
          }}
        />
      )}
    </div>
  );
}

export function UserManagementTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-72 rounded-md" />
      <div className="rounded-md border border-border bg-card">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
