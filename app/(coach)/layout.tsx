import { requireRole } from "@/lib/rbac";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("coach");
  return <>{children}</>;
}
