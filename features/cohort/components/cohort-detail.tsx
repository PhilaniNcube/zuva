import { notFound } from "next/navigation";

import { getCohort, listCohortScholars } from "../cohort-queries";
import { CohortEditForm } from "./cohort-edit-form";
import { ScholarEnrollForm } from "./scholar-enroll-form";

export async function CohortDetail({ id }: { id: Promise<string> }) {
  const cohortId = await id;
  const [cohort, scholars] = await Promise.all([
    getCohort(cohortId),
    listCohortScholars(cohortId),
  ]);
  if (!cohort) notFound();

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{cohort.name}</h1>
            <p className="text-sm text-zinc-500">
              {cohort.status} · starts{" "}
              {cohort.startsAt.toLocaleDateString("en-GB", { timeZone: "UTC" })}
              {cohort.endsAt
                ? ` · ends ${cohort.endsAt.toLocaleDateString("en-GB", { timeZone: "UTC" })}`
                : ""}
            </p>
          </div>
        </div>
        <CohortEditForm
          cohortId={cohort.id}
          initial={{
            name: cohort.name,
            startsAt: toDateInputValue(cohort.startsAt),
            endsAt: cohort.endsAt ? toDateInputValue(cohort.endsAt) : "",
            status: cohort.status,
          }}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Scholars ({scholars.length})
        </h2>
        {scholars.length === 0 ? (
          <p className="mb-4 text-sm text-zinc-500">
            No scholars enrolled yet.
          </p>
        ) : (
          <div className="mb-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Country</th>
                  <th className="px-4 py-2 font-medium">Onboarded</th>
                </tr>
              </thead>
              <tbody>
                {scholars.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-4 py-2 font-medium">{s.name}</td>
                    <td className="px-4 py-2">{s.email}</td>
                    <td className="px-4 py-2">{s.country ?? "—"}</td>
                    <td className="px-4 py-2">
                      {s.onboardedAt ? "Yes" : "Not yet"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <ScholarEnrollForm cohortId={cohort.id} />
      </section>
    </div>
  );
}

export function CohortDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="h-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}
