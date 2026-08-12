"use server";

import { randomBytes } from "node:crypto";

import { refresh } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cohort, scholarEnrollment, scholarProfile, user } from "@/lib/db/schema";
import { requireRole } from "@/lib/rbac";

const optionalDate = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  z.coerce.date().optional(),
);

const cohortInputSchema = z.object({
  name: z.string().trim().min(3, "Cohort name is required").max(100),
  startsAt: z.coerce.date({ error: "Start date is required" }),
  endsAt: optionalDate,
  status: z.enum(["draft", "active", "completed"]),
});

export async function createCohort(input: unknown): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = cohortInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  await db.insert(cohort).values(parsed.data);
  refresh();
  return { ok: true, data: undefined };
}

export async function updateCohort(
  cohortId: string,
  input: unknown,
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = cohortInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  await db.update(cohort).set(parsed.data).where(eq(cohort.id, cohortId));
  refresh();
  return { ok: true, data: undefined };
}

const enrollSchema = z.object({
  cohortId: z.string().min(1),
  name: z.string().trim().min(2, "Scholar name is required").max(100),
  email: z.string().email("A valid email is required"),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  degree: z.string().trim().max(150).optional().or(z.literal("")),
  institution: z.string().trim().max(150).optional().or(z.literal("")),
  whatsappNumber: z.string().trim().max(30).optional().or(z.literal("")),
  sendEmail: z.boolean().optional().default(true),
  markOnboardingCompleted: z.boolean().optional().default(false),
});

/**
 * Provisions a scholar account (or enrols an existing scholar) into the cohort.
 * Sends an invitation & enrolment email with account details and login link if sendEmail is true.
 */
export async function enrollScholar(
  input: unknown,
): Promise<ActionResult<{ tempPassword: string; emailSent: boolean }>> {
  await requireRole("admin");
  const parsed = enrollSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { cohortId, name, email, country, degree, institution, whatsappNumber, sendEmail, markOnboardingCompleted } = parsed.data;

  const [existingUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, email));

  let userId: string;
  let tempPassword: string | undefined = undefined;

  if (existingUser) {
    if (existingUser.role !== "scholar") {
      return {
        ok: false,
        error: "An account with this email exists but is not a scholar account.",
      };
    }
    userId = existingUser.id;

    // Check existing enrollment in this specific cohort
    const [existingEnrollment] = await db
      .select()
      .from(scholarEnrollment)
      .where(
        and(
          eq(scholarEnrollment.scholarId, userId),
          eq(scholarEnrollment.cohortId, cohortId)
        )
      );

    if (existingEnrollment) {
      return { ok: false, error: "Scholar is already enrolled in this cohort." };
    }

    const [existingProfile] = await db
      .select()
      .from(scholarProfile)
      .where(eq(scholarProfile.userId, userId));

    if (existingProfile) {
      await db
        .update(scholarProfile)
        .set({
          country: country || existingProfile.country,
          degree: degree || existingProfile.degree,
          institution: institution || existingProfile.institution,
          whatsappNumber: whatsappNumber || existingProfile.whatsappNumber,
          onboardingCompletedAt:
            markOnboardingCompleted && !existingProfile.onboardingCompletedAt
              ? new Date()
              : existingProfile.onboardingCompletedAt,
        })
        .where(eq(scholarProfile.id, existingProfile.id));
    } else {
      await db.insert(scholarProfile).values({
        userId,
        country: country || null,
        degree: degree || null,
        institution: institution || null,
        whatsappNumber: whatsappNumber || null,
        onboardingCompletedAt: markOnboardingCompleted ? new Date() : null,
      });
    }

    await db.insert(scholarEnrollment).values({
      scholarId: userId,
      cohortId,
    });
  } else {
    tempPassword = `zuva-${randomBytes(4).toString("hex")}`;
    try {
      const result = await auth.api.signUpEmail({
        body: { name, email, password: tempPassword },
      });
      userId = result.user.id;
    } catch {
      return {
        ok: false,
        error: "Could not create the account — please verify the email address.",
      };
    }

    await db.update(user).set({ role: "scholar" }).where(eq(user.id, userId));
    await db.insert(scholarProfile).values({
      userId,
      country: country || null,
      degree: degree || null,
      institution: institution || null,
      whatsappNumber: whatsappNumber || null,
      onboardingCompletedAt: markOnboardingCompleted ? new Date() : null,
    });
    await db.insert(scholarEnrollment).values({
      scholarId: userId,
      cohortId,
    });
  }

  let emailSent = false;
  if (sendEmail) {
    const { sendScholarEnrolledEmail } = await import("@/lib/email");
    const emailRes = await sendScholarEnrolledEmail({
      to: email,
      scholarName: existingUser ? existingUser.name : name,
      tempPassword,
      userId,
    });
    emailSent = emailRes.sent;
  }

  refresh();
  return {
    ok: true,
    data: { tempPassword: tempPassword ?? "", emailSent },
  };
}

const bulkScholarItemSchema = z.object({
  name: z.string().trim().min(2, "Scholar name is required").max(100),
  email: z.string().email("A valid email is required"),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  degree: z.string().trim().max(150).optional().or(z.literal("")),
  institution: z.string().trim().max(150).optional().or(z.literal("")),
});

const bulkEnrollSchema = z.object({
  cohortId: z.string().min(1, "Cohort ID is required"),
  scholars: z.array(bulkScholarItemSchema).min(1, "At least one scholar is required"),
  sendEmail: z.boolean().optional().default(false),
  markOnboardingCompleted: z.boolean().optional().default(true),
});

export async function bulkEnrollScholars(
  input: unknown,
): Promise<
  ActionResult<{ enrolledCount: number; skippedCount: number; errors: string[] }>
> {
  await requireRole("admin");
  const parsed = bulkEnrollSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { cohortId, scholars, sendEmail, markOnboardingCompleted } = parsed.data;
  let enrolledCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  let sendScholarEnrolledEmailFn:
    | typeof import("@/lib/email")["sendScholarEnrolledEmail"]
    | undefined;

  if (sendEmail) {
    const emailModule = await import("@/lib/email");
    sendScholarEnrolledEmailFn = emailModule.sendScholarEnrolledEmail;
  }

  for (const s of scholars) {
    try {
      const [existingUser] = await db
        .select()
        .from(user)
        .where(eq(user.email, s.email));

      let userId: string;
      let tempPassword: string | undefined = undefined;

      if (existingUser) {
        if (existingUser.role !== "scholar") {
          errors.push(`${s.email}: User exists but is not a scholar account.`);
          skippedCount++;
          continue;
        }
        userId = existingUser.id;

        const [existingEnrollment] = await db
          .select()
          .from(scholarEnrollment)
          .where(
            and(
              eq(scholarEnrollment.scholarId, userId),
              eq(scholarEnrollment.cohortId, cohortId)
            )
          );

        if (existingEnrollment) {
          skippedCount++;
          continue;
        }

        const [existingProfile] = await db
          .select()
          .from(scholarProfile)
          .where(eq(scholarProfile.userId, userId));

        if (existingProfile) {
          await db
            .update(scholarProfile)
            .set({
              country: s.country || existingProfile.country,
              degree: s.degree || existingProfile.degree,
              institution: s.institution || existingProfile.institution,
              onboardingCompletedAt:
                markOnboardingCompleted && !existingProfile.onboardingCompletedAt
                  ? new Date()
                  : existingProfile.onboardingCompletedAt,
            })
            .where(eq(scholarProfile.id, existingProfile.id));
        } else {
          await db.insert(scholarProfile).values({
            userId,
            country: s.country || null,
            degree: s.degree || null,
            institution: s.institution || null,
            onboardingCompletedAt: markOnboardingCompleted ? new Date() : null,
          });
        }

        await db.insert(scholarEnrollment).values({
          scholarId: userId,
          cohortId,
        });
        enrolledCount++;
      } else {
        tempPassword = `zuva-${randomBytes(4).toString("hex")}`;
        const result = await auth.api.signUpEmail({
          body: { name: s.name, email: s.email, password: tempPassword },
        });
        userId = result.user.id;

        await db.update(user).set({ role: "scholar" }).where(eq(user.id, userId));
        await db.insert(scholarProfile).values({
          userId,
          country: s.country || null,
          degree: s.degree || null,
          institution: s.institution || null,
          onboardingCompletedAt: markOnboardingCompleted ? new Date() : null,
        });

        await db.insert(scholarEnrollment).values({
          scholarId: userId,
          cohortId,
        });

        if (sendEmail && sendScholarEnrolledEmailFn) {
          await sendScholarEnrolledEmailFn({
            to: s.email,
            scholarName: s.name,
            tempPassword,
            userId,
          });
        }
        enrolledCount++;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to enrol";
      errors.push(`${s.email}: ${errMsg}`);
      skippedCount++;
    }
  }

  refresh();
  return {
    ok: true,
    data: { enrolledCount, skippedCount, errors },
  };
}

const deleteCohortSchema = z.object({
  cohortId: z.string().min(1, "Cohort ID is required"),
});

export async function deleteCohort(input: unknown): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = deleteCohortSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { cohortId } = parsed.data;

  const [existing] = await db
    .select()
    .from(cohort)
    .where(eq(cohort.id, cohortId));

  if (!existing) {
    return { ok: false, error: "Cohort not found" };
  }

  await db.delete(cohort).where(eq(cohort.id, cohortId));

  refresh();
  return { ok: true, data: undefined };
}

const unenrollScholarSchema = z.object({
  scholarId: z.string().min(1, "Scholar ID is required"),
  cohortId: z.string().min(1, "Cohort ID is required"),
});

export async function unenrollScholar(input: unknown): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = unenrollScholarSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { scholarId, cohortId } = parsed.data;

  const [enrollment] = await db
    .select()
    .from(scholarEnrollment)
    .where(
      and(
        eq(scholarEnrollment.scholarId, scholarId),
        eq(scholarEnrollment.cohortId, cohortId)
      )
    );

  if (!enrollment) {
    return { ok: false, error: "Scholar is not enrolled in this cohort" };
  }

  await db
    .delete(scholarEnrollment)
    .where(eq(scholarEnrollment.id, enrollment.id));

  refresh();
  return { ok: true, data: undefined };
}

