import { getCertificateStatus } from "../certificate-queries";

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  eligible: "Eligible for review",
  pending_approval: "Pending MINDS approval",
  issued: "Certificate issued",
};

const STATUS_STYLES: Record<string, string> = {
  not_started: "border-zinc-200 dark:border-zinc-800",
  in_progress: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30",
  eligible: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
  pending_approval: "border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/30",
  issued: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30",
};

export async function CertificateStatus({ scholarId }: { scholarId: string }) {
  const cert = await getCertificateStatus(scholarId);
  const pct = Math.min(100, (cert.feedbackCount / cert.threshold) * 100);

  return (
    <section
      className={`rounded-lg border px-4 py-3 ${STATUS_STYLES[cert.status]}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Certificate</h2>
        <span className="text-xs font-medium">
          {STATUS_LABELS[cert.status]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Feedback forms</span>
          <span>
            {cert.feedbackCount} / {cert.threshold}
          </span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-2 rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {cert.adminNote ? (
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          Note from admin: {cert.adminNote}
        </p>
      ) : null}

      {cert.issuedAt && cert.pdfFileKey ? (
        <div className="mt-3">
          <a
            href={`/api/files?key=${encodeURIComponent(cert.pdfFileKey)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
          >
            Download certificate
          </a>
        </div>
      ) : cert.issuedAt ? (
        <p className="mt-2 text-xs text-green-600 dark:text-green-400">
          Issued — your certificate is being generated.
        </p>
      ) : null}
    </section>
  );
}

export function CertificateStatusSkeleton() {
  return (
    <div className="h-24 animate-pulse rounded-lg border border-zinc-200 dark:border-zinc-800" />
  );
}
