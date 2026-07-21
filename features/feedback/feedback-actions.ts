"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { feedbackSubmission, certificate } from "@/lib/db/schema";
import { requireRole } from "@/lib/rbac";
import { getScholarProfile } from "@/features/user/user-queries";
import type { ActionResult } from "@/lib/action-result";

const FEEDBACK_ELIGIBILITY_THRESHOLD = 5;

const submitFeedbackSchema = z.object({
  sessionId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  isAnonymous: z.boolean().default(false),
});

export async function submitFeedback(formData: FormData) {
  const { user } = await requireRole("scholar");

  const parsed = submitFeedbackSchema.parse({
    sessionId: formData.get("sessionId"),
    rating: Number(formData.get("rating")),
    comment: formData.get("comment") || undefined,
    isAnonymous: formData.get("isAnonymous") === "true",
  });

  // Prevent duplicate feedback for the same session.
  const [existing] = await db
    .select({ id: feedbackSubmission.id })
    .from(feedbackSubmission)
    .where(
      and(
        eq(feedbackSubmission.sessionId, parsed.sessionId),
        eq(feedbackSubmission.scholarId, user.id),
      ),
    );
  if (existing) {
    return { ok: false, error: "Feedback already submitted for this session." } satisfies ActionResult;
  }

  const [inserted] = await db
    .insert(feedbackSubmission)
    .values({
      sessionId: parsed.sessionId,
      scholarId: user.id,
      isAnonymous: parsed.isAnonymous,
      responses: {
        rating: parsed.rating,
        ...(parsed.comment ? { comment: parsed.comment } : {}),
      },
    })
    .returning();

  // Auto-flag certificate eligibility when the scholar hits 5 feedback forms.
  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedbackSubmission)
    .where(eq(feedbackSubmission.scholarId, user.id));
  const count = countRow?.count ?? 0;
  if (count >= FEEDBACK_ELIGIBILITY_THRESHOLD) {
    const profile = await getScholarProfile(user.id);
    if (profile?.cohortId) {
      await db
        .insert(certificate)
        .values({
          scholarId: user.id,
          cohortId: profile.cohortId,
          status: "eligible",
        })
        .onConflictDoNothing({ target: certificate.scholarId });
    }
  }

  refresh();
  redirect("/sessions?feedback=submitted");
}
