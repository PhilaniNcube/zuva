import { Suspense } from "react";
import { redirect } from "next/navigation";

import { FeedbackForm } from "@/features/feedback/components/feedback-form";
import { getFeedbackForSession } from "@/features/feedback/feedback-queries";
import { getSessionDetail } from "@/features/session/session-queries";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { attendance } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

async function FeedbackPageContent({ id }: { id: Promise<string> }) {
  const sessionId = await id;
  const { user } = await requireRole("scholar");

  const session = await getSessionDetail(sessionId);
  if (!session) redirect("/sessions");

  // Verify the scholar attended this session.
  const [attended] = await db
    .select({ id: attendance.id })
    .from(attendance)
    .where(
      and(
        eq(attendance.sessionId, sessionId),
        eq(attendance.scholarId, user.id),
      ),
    );
  if (!attended) redirect("/sessions");

  // Redirect if feedback already submitted.
  const existing = await getFeedbackForSession(sessionId, user.id);
  if (existing) redirect("/sessions?feedback=already_submitted");

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Session feedback</h1>
      <FeedbackForm
        sessionId={sessionId}
        sessionTitle={session.title}
        coachName={session.coachName}
      />
    </main>
  );
}

export default function FeedbackPage({
  params,
}: PageProps<"/sessions/[id]/feedback">) {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <FeedbackPageContent id={params.then((p) => p.id)} />
    </Suspense>
  );
}
