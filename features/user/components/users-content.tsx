import { requireRole } from "@/lib/rbac";
import { getUsersForAdminPaginated } from "@/features/user/user-queries";
import {
  UserManagementTable,
  UserManagementTableSkeleton,
} from "@/features/user/components/user-management-table";

interface UsersContentProps {
  page?: number;
  pageSize?: number;
  country?: string;
  role?: string;
  search?: string;
  onboardingStatus?: string;
}

export async function UsersContent({
  page = 1,
  pageSize = 10,
  country,
  role,
  search,
  onboardingStatus,
}: UsersContentProps = {}) {
  const session = await requireRole("admin");
  const { users, totalCount, pageCount, availableCountries } =
    await getUsersForAdminPaginated({
      page,
      pageSize,
      country,
      role,
      search,
      onboardingStatus,
    });

  return (
    <UserManagementTable
      users={users}
      totalCount={totalCount}
      pageCount={pageCount}
      page={page}
      pageSize={pageSize}
      country={country}
      role={role}
      search={search}
      onboardingStatus={onboardingStatus}
      availableCountries={availableCountries}
      currentUserId={session.user.id}
    />
  );
}

export { UserManagementTableSkeleton };
