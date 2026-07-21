import { listEligibleCertificates } from "../certificate-queries";
import { AdvanceForm } from "./advance-form";

export async function CertificateAdminList() {
  const certificates = await listEligibleCertificates();

  if (certificates.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No certificates awaiting advancement.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="px-4 py-2 font-medium">Scholar</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Cohort</th>
            <th className="px-4 py-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {certificates.map((c) => (
            <tr
              key={c.id}
              className="border-t border-zinc-100 dark:border-zinc-800"
            >
              <td className="px-4 py-2 font-medium">{c.scholarName}</td>
              <td className="px-4 py-2 text-zinc-500">{c.scholarEmail}</td>
              <td className="px-4 py-2">{c.cohortName}</td>
              <td className="px-4 py-2">
                <AdvanceForm certificateId={c.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CertificateAdminListSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="h-8 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}
