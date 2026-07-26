"use client";

import { useActionState, useEffect, useState, startTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";

import { promoteUserToAdmin } from "@/features/user/user-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  image: string | null;
  createdAt: Date;
}

interface UserManagementTableProps {
  users: UserItem[];
  currentUserId: string;
}

const promoteSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

type PromoteFormValues = z.infer<typeof promoteSchema>;

async function action(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return promoteUserToAdmin({
    userId: formData.get("userId"),
  });
}

function PromoteAdminDialog({
  user,
}: {
  user: UserItem;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);

  const form = useForm<PromoteFormValues>({
    resolver: zodResolver(promoteSchema),
    defaultValues: {
      userId: user.id,
    },
  });

  useEffect(() => {
    if (state?.ok) {
      toast.success(`${user.name} has been promoted to Admin`);
      setOpen(false);
    }
    if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state, user.name]);

  function onSubmit(data: PromoteFormValues) {
    const formData = new FormData();
    formData.set("userId", data.userId);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <UserCheck className="size-3.5" />
            Promote to Admin
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-500" />
            Confirm Admin Promotion
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to promote <strong>{user.name}</strong> (
            {user.email}) to the <strong>Admin</strong> role? Admins have full access to platform settings and management.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("userId")} />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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

export function UserManagementTable({
  users,
  currentUserId,
}: UserManagementTableProps) {
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or role..."
          className="pl-9"
        />
      </div>

      {/* Users Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="hidden sm:table-cell">Joined</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-24 text-center text-muted-foreground"
              >
                No users found matching "{search}".
              </TableCell>
            </TableRow>
          ) : (
            filteredUsers.map((u) => {
              const isSelf = u.id === currentUserId;
              const isAdmin = u.role === "admin";

              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        {u.image ? (
                          <AvatarImage src={u.image} alt={u.name} />
                        ) : null}
                        <AvatarFallback className="text-xs font-semibold">
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground text-sm">
                          {u.name} {isSelf && "(You)"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getRoleBadgeVariant(u.role)}
                      className="capitalize text-xs px-2.5 py-0.5 rounded-full font-medium"
                    >
                      {isAdmin && <ShieldCheck className="mr-1 size-3" />}
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin ? (
                      <span className="text-xs text-muted-foreground italic">
                        Admin
                      </span>
                    ) : (
                      <PromoteAdminDialog user={u} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
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
