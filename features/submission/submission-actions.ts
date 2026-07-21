"use server";

import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import {
  submission as submissionTable,
  submissionEvent,
} from "@/lib/db/schema";
import { requireRole } from "@/lib/rbac";

// ---------------------------------------------------------------------------
// Scholar: create a submission
// ---------------------------------------------------------------------------

const createSchema = z.object({
  title: z.string().trim().min(3, "A descriptive title is required").max(150),
  fileKey: z.string().min(1, "File key is required"),
});

export async function createSubmission(
  input: unknown,
): Promise<ActionResult> {
  const { user: scholar } = await requireRole("scholar");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const [sub] = await db
    .insert(submissionTable)
    .values({
      scholarId: scholar.id,
      title: parsed.data.title,
      fileKey: parsed.data.fileKey,
    })
    .returning();

  await db.insert(submissionEvent).values({
    submissionId: sub.id,
    fromStatus: null,
    toStatus: "submitted",
    changedBy: scholar.id,
  });

  refresh();
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Admin: submission workflow transitions
// ---------------------------------------------------------------------------

export async function startCriticalReview(
  input: unknown,
): Promise<ActionResult> {
  const { user: admin } = await requireRole("admin");
  const parsed = z
    .object({
      submissionId: z.string().min(1),
      reviewerId: z.string().min(1),
      dueAt: z.coerce.date().optional(),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { submissionId, reviewerId, dueAt } = parsed.data;
  const [sub] = await db
    .select()
    .from(submissionTable)
    .where(eq(submissionTable.id, submissionId));
  if (!sub) return { ok: false, error: "Submission not found" };
  if (sub.status !== "submitted") {
    return { ok: false, error: "Can only start review on submitted documents." };
  }

  await db
    .update(submissionTable)
    .set({ status: "critical_review", reviewerId, dueAt: dueAt ?? null })
    .where(eq(submissionTable.id, submissionId));
  await db.insert(submissionEvent).values({
    submissionId,
    fromStatus: "submitted",
    toStatus: "critical_review",
    note: `Reviewer: ${reviewerId}`,
    changedBy: admin.id,
  });

  refresh();
  return { ok: true, data: undefined };
}

export async function startLanguageEditing(
  input: unknown,
): Promise<ActionResult> {
  const { user: admin } = await requireRole("admin");
  const parsed = z
    .object({
      submissionId: z.string().min(1),
      editorId: z.string().min(1),
      dueAt: z.coerce.date().optional(),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { submissionId, editorId, dueAt } = parsed.data;
  const [sub] = await db
    .select()
    .from(submissionTable)
    .where(eq(submissionTable.id, submissionId));
  if (!sub) return { ok: false, error: "Submission not found" };
  if (sub.status !== "critical_review") {
    return {
      ok: false,
      error: "Document must be in Critical Review before sending to editing.",
    };
  }

  await db
    .update(submissionTable)
    .set({ status: "language_editing", editorId, dueAt: dueAt ?? null })
    .where(eq(submissionTable.id, submissionId));
  await db.insert(submissionEvent).values({
    submissionId,
    fromStatus: "critical_review",
    toStatus: "language_editing",
    note: `Editor: ${editorId}`,
    changedBy: admin.id,
  });

  refresh();
  return { ok: true, data: undefined };
}

export async function returnSubmission(
  input: unknown,
): Promise<ActionResult> {
  const { user: admin } = await requireRole("admin");
  const parsed = z
    .object({
      submissionId: z.string().min(1),
      returnedFileKey: z.string().min(1, "Returned file key is required"),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { submissionId, returnedFileKey } = parsed.data;
  const [sub] = await db
    .select()
    .from(submissionTable)
    .where(eq(submissionTable.id, submissionId));
  if (!sub) return { ok: false, error: "Submission not found" };
  if (sub.status !== "language_editing") {
    return {
      ok: false,
      error: "Document must be in Language Editing before returning to the scholar.",
    };
  }

  await db
    .update(submissionTable)
    .set({ status: "returned", returnedFileKey })
    .where(eq(submissionTable.id, submissionId));
  await db.insert(submissionEvent).values({
    submissionId,
    fromStatus: "language_editing",
    toStatus: "returned",
    changedBy: admin.id,
  });

  refresh();
  return { ok: true, data: undefined };
}
