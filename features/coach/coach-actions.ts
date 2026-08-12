"use server";

import { randomBytes } from "node:crypto";

import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { coachProfile, user } from "@/lib/db/schema";
import { requireRole } from "@/lib/rbac";

const coachInputSchema = z.object({
  name: z.string().trim().min(2, "Coach name is required").max(100),
  email: z.email("A valid email is required"),
  specialty: z.enum([
    "academic_writing",
    "leadership",
    "data_decisions",
    "one_on_one",
  ]),
  whatsappNumber: z
    .string()
    .trim()
    .min(7, "WhatsApp number is required (international format)")
    .max(30),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
});

/** Provisions a coach account; returns the temporary password once. */
export async function createCoach(
  input: unknown,
): Promise<
  ActionResult<{
    tempPassword: string;
    emailSent: boolean;
    emailReason?: "resend_not_configured" | "send_failed";
  }>
> {
  await requireRole("admin");
  const parsed = coachInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, email, specialty, whatsappNumber, bio } = parsed.data;

  const tempPassword = `zuva-${randomBytes(4).toString("hex")}`;

  let userId: string;
  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password: tempPassword },
    });
    userId = result.user.id;
  } catch {
    return {
      ok: false,
      error: "Could not create the account — the email may already be in use.",
    };
  }

  await db.update(user).set({ role: "coach" }).where(eq(user.id, userId));
  await db.insert(coachProfile).values({
    userId,
    specialty,
    whatsappNumber,
    bio: bio || null,
  });

  const { sendCoachWelcomeEmail } = await import("@/lib/email");
  const emailResult = await sendCoachWelcomeEmail({
    to: email,
    coachName: name,
    tempPassword,
    userId,
  });

  refresh();
  return {
    ok: true,
    data: {
      tempPassword,
      emailSent: emailResult.sent,
      emailReason: emailResult.reason,
    },
  };
}

const updateCoachSchema = coachInputSchema
  .omit({ email: true })
  .partial({ name: true })
  .extend({
    icalUrl: z
      .string()
      .trim()
      .url("Must be a valid URL (https://... or http://...)")
      .optional()
      .or(z.literal("")),
  });

export async function updateCoach(
  coachUserId: string,
  input: unknown,
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = updateCoachSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, specialty, whatsappNumber, bio, icalUrl } = parsed.data;
  if (name) {
    await db.update(user).set({ name }).where(eq(user.id, coachUserId));
  }
  await db
    .update(coachProfile)
    .set({
      specialty,
      whatsappNumber,
      bio: bio || null,
      ...(icalUrl !== undefined ? { icalUrl: icalUrl || null } : {}),
    })
    .where(eq(coachProfile.userId, coachUserId));

  if (icalUrl) {
    const { syncCoachAvailabilityForUser } = await import("./coach-sync-actions");
    await syncCoachAvailabilityForUser(coachUserId);
  }

  refresh();
  return { ok: true, data: undefined };
}


