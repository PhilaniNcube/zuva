import { Suspense } from "react";
import type { Metadata } from "next";

import {
  UsersContent,
  UserManagementTableSkeleton,
} from "@/features/user/components/users-content";

export const metadata: Metadata = { title: "User Management | ZUVA Admin" };

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground">
          View registered accounts and manage admin role permissions.
        </p>
      </div>

      <Suspense fallback={<UserManagementTableSkeleton />}>
        <UsersContent />
      </Suspense>
    </div>
  );
}
