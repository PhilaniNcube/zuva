import { LocalTime } from "@/components/local-time";
import { listCoaches } from "@/features/coach/coach-queries";

import { listEditingQueue } from "../submission-queries";
import {
  ReturnFileForm,
  StartEditingForm,
  StartReviewForm,
} from "./editing-form-actions";

const STATUS_STYLES: Record<string, string> = {
  submitted:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  critical_review:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  language_editing:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  returned: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  critical_review: "Critical Review",
  language_editing: "Language Editing",
  returned: "Returned",
};

export async function EditingQueue({
  statusFilter,
}: {
  statusFilter: string | null;
}) {
  const [submissions, coaches] = await Promise.all([
    listEditingQueue(statusFilter),
    listCoaches(),
  ]);

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        {statusFilter
          ? `No submissions with status "${statusFilter}".`
          : "No submissions yet."}
      </p>
    );
  }

  const coachOptions = coaches.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="px-4 py-2 font-medium">Title</th>
            <th className="px-4 py-2 font-medium">Scholar</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Submitted</th>
            <th className="px-4 py-2 font-medium">Reviewer</th>
            <th className="px-4 py-2 font-medium">Editor</th>
            <th className="px-4 py-2 font-medium">Due</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr
              key={s.id}
              className="border-t border-zinc-100 dark:border-zinc-800"
            >
              <td className="max-w-48 truncate px-4 py-2 font-medium">
                {s.title}
              </td>
              <td className="px-4 py-2">{s.scholarName}</td>
              <td className="px-4 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status]}`}
                >
                  {STATUS_LABELS[s.status]}
                </span>
              </td>
              <td className="px-4 py-2">
                <LocalTime value={s.createdAt} format="date" />
              </td>
              <td className="px-4 py-2 text-xs">{s.reviewerName ?? "—"}</td>
              <td className="px-4 py-2 text-xs">{s.editorName ?? "—"}</td>
              <td className="px-4 py-2 text-zinc-500">
                {s.dueAt ? <LocalTime value={s.dueAt} format="date" /> : "—"}
              </td>
              <td className="px-4 py-2 text-right">
                {s.status === "submitted" ? (
                  <StartReviewForm
                    submissionId={s.id}
                    coaches={coachOptions}
                    onDone={() => {}}
                  />
                ) : s.status === "critical_review" ? (
                  <StartEditingForm
                    submissionId={s.id}
                    coaches={coachOptions}
                    onDone={() => {}}
                  />
                ) : s.status === "language_editing" ? (
                  <ReturnFileForm
                    submissionId={s.id}
                    onDone={() => {}}
                  />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EditingQueueSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="mb-2 h-8 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
        />
      ))}
    </div>
  );
}
