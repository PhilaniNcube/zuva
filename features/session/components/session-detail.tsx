import Link from "next/link";
import { notFound } from "next/navigation";

import { LocalTime } from "@/components/local-time";
import { SPECIALTIES } from "@/features/coach/specialties";
import { AddSessionResourceForm } from "@/features/resource/components/add-session-resource-form";
import { ResourceEngagementSummary } from "@/features/resource/components/resource-engagement-summary";
import { SessionResourceList } from "@/features/resource/components/session-resource-list";
import {
  getSessionResourceEngagementStats,
  listResourcesForSession,
} from "@/features/resource/resource-queries";
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

  // Access control: scholars need a confirmed booking (coaching 1:1), to be
  // the targeted scholar (onboarding 1:1), or cohort membership (group
  // sessions); coaches see their own; admins see all.
  const role = currentUser.role;
  let scholarProfile = null;
  if (role === "scholar") {
    scholarProfile = await getScholarProfile(currentUser.id);
    let allowed = false;
    if (session.format === "one_on_one") {
      allowed =
        session.kind === "coaching"
          ? !!(await getConfirmedBooking(sessionId, currentUser.id))
          : session.scholarId === currentUser.id;
    } else {
      allowed = scholarProfile?.cohortId === session.cohortId;
    }
    if (!allowed) notFound();
  } else if (role === "coach") {
    if (session.coachId !== currentUser.id) notFound();
  } else if (role !== "admin" && session.coachId !== currentUser.id) {
    // MINDS users only see sessions they host (onboarding).
    notFound();
  }

  const canManage = role === "admin" || (role === "coach" && session.coachId === currentUser.id);
  const isScholar = role === "scholar";

  // Fetch session resources and engagement statistics
  const [resources, engagementStats] = await Promise.all([
    listResourcesForSession(
      session.id,
      isScholar ? currentUser.id : undefined,
    ),
    canManage ? getSessionResourceEngagementStats(session.id) : Promise.resolve(null),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/sessions"
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          ← All sessions
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{session.title}</h1>
          <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-semibold">
            {session.typeName}
          </span>
          {session.status === "cancelled" ? (
            <span className="rounded-full bg-red-500/10 text-red-700 border border-red-500/20 px-2.5 py-0.5 text-xs font-medium dark:text-red-400">
              cancelled
            </span>
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground">
          <LocalTime value={session.startsAt} /> –{" "}
          <LocalTime value={session.endsAt} format="time" /> (your local time)
        </p>

        {session.coachName ? (
          <p className="text-sm text-muted-foreground">
            {session.kind === "onboarding" ? "Host" : "Coach"}:{" "}
            <span className="font-medium text-foreground">{session.coachName}</span>
            {session.specialty ? ` · ${SPECIALTIES[session.specialty]}` : ""}
          </p>
        ) : null}

        {session.description ? (
          <p className="text-sm whitespace-pre-wrap text-muted-foreground pt-2">
            {session.description}
          </p>
        ) : null}

        <div className="pt-2 flex flex-wrap items-center gap-3">
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
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              Contact coach on WhatsApp
            </a>
          ) : null}
        </div>
        {!session.meetLink && session.status !== "cancelled" ? (
          <p className="text-xs text-muted-foreground">
            The video link will appear here once it&apos;s generated.
          </p>
        ) : null}
      </div>

      {/* Pre-Session Materials Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Pre-Session Required Materials
            </h2>
            <p className="text-xs text-muted-foreground">
              Documents and video resources to read or watch prior to the session.
            </p>
          </div>
          {canManage ? (
            <AddSessionResourceForm
              sessionId={session.id}
              cohortId={session.cohortId}
            />
          ) : null}
        </div>

        {canManage && engagementStats && engagementStats.scholars.length > 0 ? (
          <ResourceEngagementSummary stats={engagementStats.scholars} />
        ) : null}

        <SessionResourceList
          resources={resources}
          sessionId={session.id}
          canManage={canManage}
          isScholar={isScholar}
        />
      </div>
    </div>
  );
}

export function SessionDetailSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="h-4 w-24 animate-pulse rounded bg-muted/60" />
      <div className="h-56 animate-pulse rounded-xl bg-muted/60" />
      <div className="h-48 animate-pulse rounded-xl bg-muted/60" />
    </div>
  );
}
