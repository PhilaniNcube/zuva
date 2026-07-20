import Link from "next/link";
import { notFound } from "next/navigation";

import { LocalTime } from "@/components/local-time";
import { SPECIALTIES } from "@/features/coach/specialties";
import { getScholarProfile } from "@/features/user/user-queries";
import { requireUser } from "@/lib/rbac";
import { sessionContactMessage, waLink } from "@/lib/whatsapp";

import { getConfirmedBooking, getSessionDetail } from "../session-queries";
import { JoinCallButton } from "./join-call-button";

export async function SessionDetail({ id }: { id: Promise<string> }) {
  const sessionId = await id;
  const [session, { user: currentUser }] = await Promise.all([
    getSessionDetail(sessionId),
    requireUser(),
  ]);
  if (!session) notFound();

  // Access control: scholars need a confirmed booking (1:1) or cohort
  // membership (group sessions); coaches see their own; admins see all.
  const role = currentUser.role;
  let scholarProfile = null;
  if (role === "scholar") {
    scholarProfile = await getScholarProfile(currentUser.id);
    const allowed =
      session.type === "coaching_1on1"
        ? !!(await getConfirmedBooking(sessionId, currentUser.id))
        : scholarProfile?.cohortId === session.cohortId;
    if (!allowed) notFound();
  } else if (role === "coach") {
    if (session.coachId !== currentUser.id) notFound();
  } else if (role !== "admin") {
    notFound();
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/sessions"
          className="text-sm text-zinc-500 underline underline-offset-2"
        >
          ← All sessions
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{session.title}</h1>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {session.type === "coaching_1on1" ? "1:1 coaching" : session.type}
          </span>
          {session.status === "cancelled" ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
              cancelled
            </span>
          ) : null}
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <LocalTime value={session.startsAt} /> –{" "}
          <LocalTime value={session.endsAt} format="time" /> (your local time)
        </p>

        {session.coachName ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Coach: {session.coachName}
            {session.specialty ? ` · ${SPECIALTIES[session.specialty]}` : ""}
          </p>
        ) : null}

        {session.description ? (
          <p className="mt-4 text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
            {session.description}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {session.status !== "cancelled" ? (
            <JoinCallButton
              sessionId={session.id}
              meetLinkAvailable={!!session.meetLink}
            />
          ) : null}
          {role === "scholar" && session.coachWhatsapp && scholarProfile ? (
            <a
              href={waLink(
                session.coachWhatsapp,
                sessionContactMessage({
                  scholarName: currentUser.name,
                  sessionTitle: session.title,
                  startsAt: session.startsAt,
                }),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            >
              Contact coach on WhatsApp
            </a>
          ) : null}
        </div>
        {!session.meetLink && session.status !== "cancelled" ? (
          <p className="mt-3 text-xs text-zinc-500">
            The video link will appear here once it&apos;s generated.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SessionDetailSkeleton() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-56 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}
