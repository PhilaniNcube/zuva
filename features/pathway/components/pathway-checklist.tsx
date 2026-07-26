import { getPathwayProgress } from "../pathway-queries";

const KIND_ICONS: Record<string, string> = {
  orientation: "🎯",
  masterclass: "📚",
  coaching: "💬",
  feedback: "📝",
};

export async function PathwayChecklist({
  scholarId,
  cohortId,
}: {
  scholarId: string;
  cohortId: string;
}) {
  const steps = await getPathwayProgress(scholarId, cohortId);

  if (steps.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No pathway steps defined for your cohort yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step) => (
        <div
          key={step.id}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
            step.completed
              ? "border-teal-200 bg-teal-50/50"
              : "border-zinc-200"
          }`}
        >
          <span className="mt-0.5 text-lg" aria-hidden>
            {KIND_ICONS[step.kind] ?? "•"}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p
                className={`text-sm font-medium ${
                  step.completed
                    ? "text-teal-900"
                    : "text-zinc-900"
                }`}
              >
                {step.title}
              </p>
              {step.completed ? (
                <span className="text-xs font-medium text-teal-700">
                  ✓ Done
                </span>
              ) : null}
            </div>
            {step.description ? (
              <p className="mt-0.5 text-xs text-zinc-500">
                {step.description}
              </p>
            ) : null}
            {step.detail ? (
              <p className="mt-1 text-xs text-zinc-500">{step.detail}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PathwayChecklistSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-lg border border-zinc-200"
        />
      ))}
    </div>
  );
}
