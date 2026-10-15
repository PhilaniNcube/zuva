import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, User } from "lucide-react";

import { LocalTime } from "@/components/local-time";
import { FeedbackForm } from "@/features/feedback/components/feedback-form";
import { getScholarCohorts } from "@/features/user/user-queries";
import { getSession } from "@/lib/rbac";
import { roleHome, type Role } from "@/lib/roles";

import {
  getMasterclassBySlug,
  getMasterclassFeedbackPrompt,
  listUpcomingSessionsForType,
} from "../masterclass-queries";

export async function MasterclassDetail({
  slug,
}: {
  slug: string | Promise<string>;
}) {
  const resolvedSlug = typeof slug === "string" ? slug : await slug;
  const masterclass = await getMasterclassBySlug(resolvedSlug);
  if (!masterclass) notFound();

  const [sessions, authSession] = await Promise.all([
    listUpcomingSessionsForType(masterclass.sessionTypeId),
    getSession(),
  ]);

  let reserveSessionId: string | null = null;
  let feedbackPrompt: Awaited<
    ReturnType<typeof getMasterclassFeedbackPrompt>
  > = null;

  const isScholar = authSession?.user.role === "scholar";
  if (authSession && isScholar) {
    const cohorts = await getScholarCohorts(authSession.user.id);
    const cohortIds = new Set(cohorts.map((c) => c.id));
    reserveSessionId =
      sessions.find((session) => cohortIds.has(session.cohortId))?.id ?? null;
    feedbackPrompt = await getMasterclassFeedbackPrompt(
      masterclass.sessionTypeId,
      authSession.user.id,
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {masterclass.heroImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={masterclass.heroImageUrl}
          alt=""
          className="h-56 w-full rounded-xl object-cover"
        />
      ) : null}

      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">ZUVA Masterclass</p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-foreground sm:text-4xl">
          {masterclass.name}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {masterclass.headline}
        </p>
        {masterclass.summary ? (
          <p className="mt-4 whitespace-pre-wrap text-muted-foreground">
            {masterclass.summary}
          </p>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-8">
          {masterclass.outcomes.length > 0 ? (
            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                What you&apos;ll take away
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {masterclass.outcomes.map((outcome) => (
                  <li
                    key={outcome}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Upcoming dates
            </h2>
            {sessions.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No upcoming dates scheduled yet — check back soon.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {sessions.slice(0, 6).map((session) => (
                  <li
                    key={session.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CalendarDays className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          <LocalTime value={session.startsAt} />
                        </p>
                        {session.coachName ? (
                          <p className="text-xs text-muted-foreground">
                            with {session.coachName}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {feedbackPrompt ? (
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Share your feedback
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                You attended this masterclass — a short review helps us improve
                it and counts toward your certificate.
              </p>
              <FeedbackForm
                sessionId={feedbackPrompt.sessionId}
                sessionTitle={feedbackPrompt.title}
                coachName={feedbackPrompt.coachName}
              />
            </section>
          ) : null}
        </div>

        <aside className="flex h-fit flex-col gap-4">
          {masterclass.facilitator ? (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                {masterclass.facilitator.image &&
                masterclass.facilitator.image.startsWith("http") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={masterclass.facilitator.image}
                    alt=""
                    className="size-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="size-5" />
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Facilitator
                  </p>
                  <p className="font-medium text-foreground">
                    {masterclass.facilitator.name}
                  </p>
                </div>
              </div>
              {masterclass.facilitator.bio ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {masterclass.facilitator.bio}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-heading text-base font-semibold text-foreground">
              Reserve your spot
            </h2>
            {!authSession ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Booking is open to enrolled ZUVA scholars. Sign in to reserve
                  your place.
                </p>
                <Link
                  href={`/login?next=/masterclasses/${masterclass.slug}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Sign in to reserve
                </Link>
              </>
            ) : isScholar && reserveSessionId ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your cohort&apos;s next session is open for you.
                </p>
                <Link
                  href={`/sessions/${reserveSessionId}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Reserve your spot
                </Link>
              </>
            ) : isScholar ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No upcoming session for your cohort yet. You&apos;ll see it on
                your Sessions page once scheduled.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Booking is reserved for enrolled scholars.
                </p>
                <Link
                  href={roleHome(authSession.user.role as Role)}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Go to your dashboard
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function MasterclassDetailSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="h-24 w-2/3 animate-pulse rounded-xl bg-muted/60" />
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="h-64 animate-pulse rounded-xl bg-muted/60" />
        <div className="h-48 animate-pulse rounded-xl bg-muted/60" />
      </div>
    </div>
  );
}
