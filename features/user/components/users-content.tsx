import { requireRole } from "@/lib/rbac";
import { getUsersForAdmin } from "@/features/user/user-queries";
import {
  UserManagementTable,
  UserManagementTableSkeleton,
} from "@/features/user/components/user-management-table";

export async function UsersContent() {
  const session = await requireRole("admin");
  const users = await getUsersForAdmin();

  return (
    <UserManagementTable
      users={users}
      currentUserId={session.user.id}
    />
  );
}

export { UserManagementTableSkeleton };
