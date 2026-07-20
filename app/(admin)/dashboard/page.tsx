import { requireRole } from "@/lib/rbac";

export default async function AdminDashboardPage() {
  const { user } = await requireRole("admin");
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Programme Dashboard</h1>
      <p className="text-sm text-zinc-500">Signed in as {user.name}.</p>
      <p className="text-zinc-400">
        Consolidated attendance, submissions, feedback, and editing turnaround
        widgets arrive in step ④.
      </p>
    </div>
  );
}
