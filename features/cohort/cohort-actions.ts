"use server";

import { randomBytes } from "node:crypto";

import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cohort, scholarProfile, user } from "@/lib/db/schema";
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
  email: z.email("A valid email is required"),
  country: z.string().trim().max(100).optional().or(z.literal("")),
});

/**
 * Provisions a scholar account and enrols them in the cohort. Returns the
 * generated temporary password once so the admin can share it securely
 * (email invites are a post-MVP nicety).
 */
export async function enrollScholar(
  input: unknown,
): Promise<ActionResult<{ tempPassword: string }>> {
  await requireRole("admin");
  const parsed = enrollSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { cohortId, name, email, country } = parsed.data;

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

  await db.update(user).set({ role: "scholar" }).where(eq(user.id, userId));
  await db.insert(scholarProfile).values({
    userId,
    cohortId,
    country: country || null,
  });

  refresh();
  return { ok: true, data: { tempPassword } };
}
