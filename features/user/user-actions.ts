"use server";

import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import { scholarProfile } from "@/lib/db/schema";
import { requireRole } from "@/lib/rbac";

const onboardingSchema = z.object({
  country: z.string().trim().min(2, "Country is required").max(100),
  whatsappNumber: z
    .string()
    .trim()
    .max(30, "WhatsApp number looks too long")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .min(10, "Tell us a little more about your work (at least 10 characters)")
    .max(2000),
  mtpText: z
    .string()
    .trim()
    .min(5, "Your Massive Transformative Purpose is required")
    .max(500),
});

export async function completeOnboarding(input: unknown): Promise<ActionResult> {
  const { user } = await requireRole("scholar");
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const v = parsed.data;
  const now = new Date();

  const [existing] = await db
    .select()
    .from(scholarProfile)
    .where(eq(scholarProfile.userId, user.id));

  if (existing) {
    await db
      .update(scholarProfile)
      .set({
        country: v.country,
        whatsappNumber: v.whatsappNumber || null,
        bio: v.bio,
        mtpText: v.mtpText,
        onboardingCompletedAt: now,
      })
      .where(eq(scholarProfile.id, existing.id));
  } else {
    await db.insert(scholarProfile).values({
      userId: user.id,
      country: v.country,
      whatsappNumber: v.whatsappNumber || null,
      bio: v.bio,
      mtpText: v.mtpText,
      onboardingCompletedAt: now,
    });
  }

  refresh();
  return { ok: true, data: undefined };
}
