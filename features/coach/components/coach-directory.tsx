import { listCoaches } from "../coach-queries";
import { SPECIALTIES } from "../specialties";
import { CoachEditForm } from "./coach-edit-form";

export async function CoachDirectory() {
  const coaches = await listCoaches();
  if (coaches.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No coaches yet — add the first one above.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Specialty</th>
            <th className="px-4 py-2 font-medium">WhatsApp</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {coaches.map((c) => (
            <tr
              key={c.id}
              className="border-t border-zinc-100 align-top dark:border-zinc-800"
            >
              <td className="px-4 py-2 font-medium">{c.name}</td>
              <td className="px-4 py-2">{SPECIALTIES[c.specialty]}</td>
              <td className="px-4 py-2 font-mono text-xs">
                {c.whatsappNumber}
              </td>
              <td className="px-4 py-2">{c.email}</td>
              <td className="px-4 py-2">
                <CoachEditForm
                  coachUserId={c.id}
                  initial={{
                    specialty: c.specialty,
                    whatsappNumber: c.whatsappNumber,
                    bio: c.bio ?? "",
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CoachDirectorySkeleton() {
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
