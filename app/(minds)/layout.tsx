import { requireRole } from "@/lib/rbac";

export default async function MindsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("minds");
  return <>{children}</>;
}
