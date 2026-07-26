"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scholarProfile, user as userTable } from "@/lib/db/schema";
import { requireRole, requireUser } from "@/lib/rbac";

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

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  whatsappNumber: z.string().trim().max(30).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  mtpText: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function updateProfileDetails(input: unknown): Promise<ActionResult> {
  const session = await requireUser();
  const currentUser = session.user;
  
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  // Update user name in user table
  await db
    .update(userTable)
    .set({ name: v.name })
    .where(eq(userTable.id, currentUser.id));

  // If scholar, update scholar profile details if provided
  if (currentUser.role === "scholar") {
    const [existing] = await db
      .select()
      .from(scholarProfile)
      .where(eq(scholarProfile.userId, currentUser.id));

    if (existing) {
      await db
        .update(scholarProfile)
        .set({
          country: v.country || existing.country,
          whatsappNumber: v.whatsappNumber ?? existing.whatsappNumber,
          bio: v.bio ?? existing.bio,
          mtpText: v.mtpText ?? existing.mtpText,
        })
        .where(eq(scholarProfile.id, existing.id));
    } else if (v.country && v.bio && v.mtpText) {
      await db.insert(scholarProfile).values({
        userId: currentUser.id,
        country: v.country,
        whatsappNumber: v.whatsappNumber || null,
        bio: v.bio,
        mtpText: v.mtpText,
      });
    }
  }

  refresh();
  return { ok: true, data: undefined };
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "Password is too long"),
  confirmPassword: z.string().min(1, "Password confirmation is required"),
  revokeOtherSessions: z.boolean().default(true),
});

export async function changeUserPassword(input: unknown): Promise<ActionResult> {
  await requireUser();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { currentPassword, newPassword, confirmPassword, revokeOtherSessions } = parsed.data;

  if (newPassword !== confirmPassword) {
    return { ok: false, error: "New passwords do not match" };
  }

  try {
    const reqHeaders = await headers();
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions,
      },
      headers: reqHeaders,
    });
    return { ok: true, data: undefined };
  } catch (err: unknown) {
    const errorObj = err as { message?: string; body?: { message?: string } };
    const errorMessage =
      errorObj?.body?.message ||
      errorObj?.message ||
      "Failed to update password. Please check your current password.";
    return { ok: false, error: errorMessage };
  }
}

const promoteUserSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required"),
});

export async function promoteUserToAdmin(input: unknown): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = promoteUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { userId } = parsed.data;

  const [existingUser] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (!existingUser) {
    return { ok: false, error: "User not found" };
  }

  if (existingUser.role === "admin") {
    return { ok: false, error: "User is already an admin" };
  }

  if (existingUser.role === "scholar") {
    return { ok: false, error: "Scholars cannot be promoted to Admin" };
  }

  await db
    .update(userTable)
    .set({ role: "admin" })
    .where(eq(userTable.id, userId));

  refresh();
  return { ok: true, data: undefined };
}
