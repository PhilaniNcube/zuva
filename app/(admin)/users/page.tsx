import { Suspense } from "react";
import type { Metadata } from "next";
import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

import {
  UsersContent,
  UserManagementTableSkeleton,
} from "@/features/user/components/users-content";

export const metadata: Metadata = { title: "User Management | ZUVA Admin" };

const userSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  country: parseAsString.withDefault(""),
  role: parseAsString.withDefault(""),
  search: parseAsString.withDefault(""),
  onboardingStatus: parseAsString.withDefault(""),
});

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page, pageSize, country, role, search, onboardingStatus } =
    await userSearchParamsCache.parse(searchParams);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground">
          View registered accounts and manage admin role permissions.
        </p>
      </div>

      <Suspense fallback={<UserManagementTableSkeleton />}>
        <UsersContent
          page={page}
          pageSize={pageSize}
          country={country}
          role={role}
          search={search}
          onboardingStatus={onboardingStatus}
        />
      </Suspense>
    </div>
  );
}
