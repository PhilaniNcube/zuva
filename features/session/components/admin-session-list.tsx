import { listAdminSessions } from "../session-queries";
import { AdminSessionTable } from "./admin-session-table";

export async function AdminSessionList() {
  const sessions = await listAdminSessions();

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No group sessions scheduled yet — create one above.
      </p>
    );
  }

  return <AdminSessionTable sessions={sessions} />;
}

export function AdminSessionListSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="mb-3 h-10 animate-pulse rounded-lg bg-muted/60"
        />
      ))}
    </div>
  );
}
