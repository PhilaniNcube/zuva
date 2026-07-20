import { AdminNav } from "@/components/admin-nav";
import { requireRole } from "@/lib/rbac";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");
  return (
    <div className="min-h-screen">
      <AdminNav />
      <main className="p-6">{children}</main>
    </div>
  );
}
