import { getAttendanceSummary, getFeedbackSummary, getRecentActivity, getSubmissionStats, listCohortOverview } from "../report-queries";
import { LocalTime } from "@/components/local-time";

export async function ReportDashboard() {
  const [cohorts, feedback, submissions, attendance, activity] =
    await Promise.all([
      listCohortOverview(),
      getFeedbackSummary(),
      getSubmissionStats(),
      getAttendanceSummary(),
      getRecentActivity(),
    ]);

  return (
    <div className="flex flex-col gap-8">
      {/* Cohort overview */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Cohorts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cohorts.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{c.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-semibold">{c.scholarCount}</p>
                  <p className="text-xs text-zinc-500">Scholars</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{c.feedbackCount}</p>
                  <p className="text-xs text-zinc-500">Feedback</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {c.certificates.issued}
                  </p>
                  <p className="text-xs text-zinc-500">Issued</p>
                </div>
              </div>
              {c.certificates.pending > 0 || c.certificates.eligible > 0 ? (
                <p className="mt-2 text-xs text-zinc-500">
                  {c.certificates.eligible} eligible · {c.certificates.pending}{" "}
                  pending approval
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Feedback + Submissions */}
      <div className="grid gap-8 sm:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Feedback</h2>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold">
                {feedback.avgRating.toFixed(1)}
              </p>
              <p className="text-sm text-zinc-500">
                average rating · {feedback.total} total
              </p>
            </div>
            {feedback.byType.length > 0 ? (
              <div className="mt-3 flex flex-col gap-1">
                {feedback.byType.map((t) => (
                  <div
                    key={t.type}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="capitalize">{t.type.replace("_", " ")}</span>
                    <span className="text-zinc-500">
                      {t.avgRating.toFixed(1)} ({t.count})
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Editing queue</h2>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex flex-col gap-2">
              {(
                [
                  ["Submitted", submissions.submitted],
                  ["Critical review", submissions.critical_review],
                  ["Language editing", submissions.language_editing],
                  ["Returned", submissions.returned],
                ] as const
              ).map(([label, count]) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{label}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Attendance */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Sessions & attendance</h2>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="grid gap-4 sm:grid-cols-3">
            {attendance.sessions.map((s) => {
              const att = attendance.attendance.find(
                (a) => a.type === s.type,
              );
              return (
                <div key={s.type} className="text-center">
                  <p className="text-2xl font-semibold">{s.count}</p>
                  <p className="text-xs text-zinc-500 capitalize">
                    {s.type.replace("_", " ")} sessions
                  </p>
                  {att ? (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {att.count} attended
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium">Latest feedback</h3>
            {activity.recentFeedback.length === 0 ? (
              <p className="text-sm text-zinc-500">No feedback yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activity.recentFeedback.map((f) => (
                  <div key={f.id} className="text-sm">
                    <p className="font-medium">{f.sessionTitle}</p>
                    <p className="text-xs text-zinc-500">
                      {f.scholarName} · <LocalTime value={f.submittedAt} />
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium">Latest submissions</h3>
            {activity.recentSubmissions.length === 0 ? (
              <p className="text-sm text-zinc-500">No submissions yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activity.recentSubmissions.map((s) => (
                  <div key={s.id} className="text-sm">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-zinc-500">
                      {s.scholarName} · {s.status} ·{" "}
                      <LocalTime value={s.createdAt} />
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export function ReportDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-lg border border-zinc-200 dark:border-zinc-800"
        />
      ))}
    </div>
  );
}
