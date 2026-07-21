"use server";

import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { certificate, cohort, scholarProfile, user } from "@/lib/db/schema";
import { generateCertificatePdf } from "@/lib/certificate-pdf";
import { sendCertificateEmail } from "@/lib/email";
import { presignGet, putObject } from "@/lib/r2";
import { requireRole } from "@/lib/rbac";
import type { ActionResult } from "@/lib/action-result";

// ---------------------------------------------------------------------------
// Admin: advance eligible → pending_approval
// ---------------------------------------------------------------------------

const advanceSchema = z.object({
  certificateId: z.string().min(1),
  adminNote: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function advanceToApproval(
  input: unknown,
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = advanceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const [cert] = await db
    .select()
    .from(certificate)
    .where(eq(certificate.id, parsed.data.certificateId));
  if (!cert) return { ok: false, error: "Certificate not found." };
  if (cert.status !== "eligible") {
    return { ok: false, error: "Certificate is not in eligible status." };
  }

  await db
    .update(certificate)
    .set({
      status: "pending_approval",
      adminNote: parsed.data.adminNote || null,
    })
    .where(eq(certificate.id, cert.id));

  refresh();
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// MINDS: approve pending_approval → issued (generates PDF + sends email)
// ---------------------------------------------------------------------------

const approveSchema = z.object({
  certificateId: z.string().min(1),
});

export async function approveCertificate(
  input: unknown,
): Promise<ActionResult> {
  const { user: mindsUser } = await requireRole("minds");
  const parsed = approveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const [cert] = await db
    .select()
    .from(certificate)
    .where(eq(certificate.id, parsed.data.certificateId));
  if (!cert) return { ok: false, error: "Certificate not found." };
  if (cert.status !== "pending_approval") {
    return { ok: false, error: "Certificate is not pending approval." };
  }

  // Fetch scholar + cohort info for the PDF.
  const [scholarUser] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, cert.scholarId));
  if (!scholarUser) return { ok: false, error: "Scholar not found." };

  const [cohortRow] = await db
    .select({ name: cohort.name })
    .from(cohort)
    .where(eq(cohort.id, cert.cohortId));

  const [profile] = await db
    .select({ mtpText: scholarProfile.mtpText })
    .from(scholarProfile)
    .where(eq(scholarProfile.userId, cert.scholarId));

  const issuedAt = new Date();
  const pdfFileKey = `certificates/${cert.scholarId}/${cert.id}.pdf`;

  // Generate and upload the PDF.
  let pdfUploaded = false;
  try {
    const pdfBuffer = await generateCertificatePdf({
      scholarName: scholarUser.name,
      mtpText: profile?.mtpText ?? cert.mtpText ?? "",
      cohortName: cohortRow?.name ?? "ZUVA Scholar",
      issuedAt,
    });
    await putObject(pdfFileKey, pdfBuffer, "application/pdf");
    pdfUploaded = true;
  } catch (err) {
    console.error("Failed to generate/upload certificate PDF:", err);
    // Continue — certificate is still issued even if PDF fails.
  }

  // Mark issued.
  await db
    .update(certificate)
    .set({
      status: "issued",
      approvedBy: mindsUser.id,
      approvedAt: issuedAt,
      issuedAt,
      pdfFileKey: pdfUploaded ? pdfFileKey : null,
      mtpText: profile?.mtpText ?? cert.mtpText,
    })
    .where(eq(certificate.id, cert.id));

  // Send email with download link.
  if (pdfUploaded) {
    const downloadUrl = await presignGet(pdfFileKey);
    if (downloadUrl) {
      await sendCertificateEmail({
        to: scholarUser.email,
        scholarName: scholarUser.name,
        certificateUrl: downloadUrl,
      });
    }
  }

  refresh();
  return { ok: true, data: undefined };
}
