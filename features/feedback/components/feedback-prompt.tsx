import Link from "next/link";

import { LocalTime } from "@/components/local-time";

import { listAttendedSessionsNeedingFeedback } from "../feedback-queries";

export async function FeedbackPrompt({ scholarId }: { scholarId: string }) {
  const sessions = await listAttendedSessionsNeedingFeedback(scholarId);

  if (sessions.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Share feedback</h2>
      <div className="flex flex-col gap-2">
        {sessions.map((s) => (
          <div
            key={s.sessionId}
            className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <div>
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-zinc-500">
                {s.coachName ? `${s.coachName} · ` : ""}
                <LocalTime value={s.startsAt} />
              </p>
            </div>
            <Link
              href={`/sessions/${s.sessionId}/feedback`}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Give feedback
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeedbackPromptSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="h-8 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}
