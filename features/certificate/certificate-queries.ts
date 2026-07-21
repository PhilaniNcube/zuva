import "server-only";

import { cache } from "react";
import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { certificate, cohort, feedbackSubmission, user } from "@/lib/db/schema";

const FEEDBACK_THRESHOLD = 5;

export type CertificateStatus = {
  status: "not_started" | "in_progress" | "eligible" | "pending_approval" | "issued";
  feedbackCount: number;
  threshold: number;
  certificateId: string | null;
  adminNote: string | null;
  issuedAt: Date | null;
  pdfFileKey: string | null;
};

/**
 * Scholar-facing certificate status. Combines the feedback count with the
 * certificate row (if one exists) to show progress and current state.
 */
export const getCertificateStatus = cache(
  async (scholarId: string): Promise<CertificateStatus> => {
    const [fbRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(feedbackSubmission)
      .where(eq(feedbackSubmission.scholarId, scholarId));
    const feedbackCount = fbRow?.count ?? 0;

    const [cert] = await db
      .select()
      .from(certificate)
      .where(eq(certificate.scholarId, scholarId));

    if (!cert) {
      return {
        status: feedbackCount > 0 ? "in_progress" : "not_started",
        feedbackCount,
        threshold: FEEDBACK_THRESHOLD,
        certificateId: null,
        adminNote: null,
        issuedAt: null,
        pdfFileKey: null,
      };
    }

    return {
      status: cert.status,
      feedbackCount,
      threshold: FEEDBACK_THRESHOLD,
      certificateId: cert.id,
      adminNote: cert.adminNote,
      issuedAt: cert.issuedAt,
      pdfFileKey: cert.pdfFileKey,
    };
  },
);

/** Admin view: all eligible certificates awaiting advancement. */
export const listEligibleCertificates = cache(async () => {
  return db
    .select({
      id: certificate.id,
      scholarId: certificate.scholarId,
      scholarName: user.name,
      scholarEmail: user.email,
      cohortName: cohort.name,
      status: certificate.status,
      adminNote: certificate.adminNote,
      createdAt: certificate.createdAt,
    })
    .from(certificate)
    .innerJoin(user, eq(user.id, certificate.scholarId))
    .innerJoin(cohort, eq(cohort.id, certificate.cohortId))
    .where(eq(certificate.status, "eligible"))
    .orderBy(desc(certificate.createdAt));
});

/** MINDS view: certificates pending approval. */
export const listPendingCertificates = cache(async () => {
  return db
    .select({
      id: certificate.id,
      scholarId: certificate.scholarId,
      scholarName: user.name,
      scholarEmail: user.email,
      cohortName: cohort.name,
      status: certificate.status,
      adminNote: certificate.adminNote,
      createdAt: certificate.createdAt,
    })
    .from(certificate)
    .innerJoin(user, eq(user.id, certificate.scholarId))
    .innerJoin(cohort, eq(cohort.id, certificate.cohortId))
    .where(eq(certificate.status, "pending_approval"))
    .orderBy(desc(certificate.createdAt));
});
