import { requireRole } from "@/lib/rbac";
import { SignOutButton } from "@/features/user/components/sign-out-button";

export default async function PathwayPage() {
  const { user } = await requireRole("scholar");
  return (
    <main className="flex min-h-screen flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Learning Pathway</h1>
        <SignOutButton />
      </div>
      <p className="text-sm text-zinc-500">
        Signed in as {user.name} ({user.email}) — role: scholar
      </p>
      <p className="text-zinc-400">Pathway checklist coming in step ⑤.</p>
    </main>
  );
}
