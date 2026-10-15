"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import {
  programmeSession,
  resource,
  resourceEngagement,
  scholarEnrollment,
  user,
} from "@/lib/db/schema";
import { sendSessionRecordingEmail } from "@/lib/email";
import { deleteObject } from "@/lib/r2";
import { requireUser } from "@/lib/rbac";
import { getSessionDetail } from "@/features/session/session-queries";

const createSchema = z
  .object({
    title: z.string().trim().min(3, "Title is required").max(150),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    type: z.enum(["document", "video", "link"]).default("document"),
    fileKey: z.string().optional().or(z.literal("")),
    url: z.string().trim().optional().or(z.literal("")),
    cohortId: z.string().optional().or(z.literal("")),
    sessionId: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => (data.fileKey && data.fileKey.length > 0) || (data.url && data.url.length > 0),
    {
      message: "Either a file upload or external link URL is required",
      path: ["url"],
    },
  );

export async function createResource(input: unknown): Promise<ActionResult> {
  const { user } = await requireUser();
  if (user.role !== "admin" && user.role !== "coach") {
    return { ok: false, error: "Only coaches and admins can publish resources." };
  }

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { title, description, type, fileKey, url, cohortId, sessionId } = parsed.data;

  // If coach, verify they host the session (if sessionId provided)
  if (user.role === "coach" && sessionId) {
    const [sess] = await db
      .select({ coachId: programmeSession.coachId })
      .from(programmeSession)
      .where(eq(programmeSession.id, sessionId));
    if (!sess || sess.coachId !== user.id) {
      return { ok: false, error: "You can only add resources to your own sessions." };
    }
  }

  await db.insert(resource).values({
    title,
    description: description || null,
    type,
    fileKey: fileKey || null,
    url: url || null,
    cohortId: cohortId || null,
    sessionId: sessionId || null,
    uploadedBy: user.id,
  });

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

export async function deleteResource(resourceId: string): Promise<ActionResult> {
  const { user } = await requireUser();
  if (user.role !== "admin" && user.role !== "coach") {
    return { ok: false, error: "Unauthorized" };
  }

  const [row] = await db
    .select()
    .from(resource)
    .where(eq(resource.id, resourceId));

  if (!row) return { ok: false, error: "Resource not found" };

  if (user.role === "coach") {
    if (row.uploadedBy !== user.id) {
      if (row.sessionId) {
        const [sess] = await db
          .select({ coachId: programmeSession.coachId })
          .from(programmeSession)
          .where(eq(programmeSession.id, row.sessionId));
        if (!sess || sess.coachId !== user.id) {
          return { ok: false, error: "You can only delete resources for your own sessions." };
        }
      } else {
        return { ok: false, error: "You can only delete your own uploaded resources." };
      }
    }
  }

  await db.delete(resource).where(eq(resource.id, resourceId));
  if (row.fileKey) await deleteObject(row.fileKey).catch(() => {});

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

const trackSchema = z.object({
  resourceId: z.string().min(1, "Resource ID is required"),
  sessionId: z.string().optional().or(z.literal("")),
  action: z.enum(["view", "complete", "toggle"]),
});

export async function trackResourceEngagement(input: unknown): Promise<ActionResult> {
  const { user } = await requireUser();
  const parsed = trackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { resourceId, sessionId, action } = parsed.data;

  const [res] = await db.select().from(resource).where(eq(resource.id, resourceId));
  if (!res) return { ok: false, error: "Resource not found" };

  const effectiveSessionId = sessionId || res.sessionId || null;

  const [existing] = await db
    .select()
    .from(resourceEngagement)
    .where(
      and(
        eq(resourceEngagement.resourceId, resourceId),
        eq(resourceEngagement.scholarId, user.id),
      ),
    );

  const now = new Date();

  if (!existing) {
    let completedAt: Date | null = null;
    if (action === "complete" || action === "toggle") {
      completedAt = now;
    }
    await db.insert(resourceEngagement).values({
      resourceId,
      scholarId: user.id,
      sessionId: effectiveSessionId,
      viewedAt: now,
      completedAt,
    });
  } else {
    if (action === "view") {
      // viewedAt already recorded; do nothing unless missing
      if (!existing.viewedAt) {
        await db
          .update(resourceEngagement)
          .set({ viewedAt: now })
          .where(eq(resourceEngagement.id, existing.id));
      }
    } else if (action === "complete") {
      await db
        .update(resourceEngagement)
        .set({
          completedAt: existing.completedAt || now,
          viewedAt: existing.viewedAt || now,
        })
        .where(eq(resourceEngagement.id, existing.id));
    } else if (action === "toggle") {
      await db
        .update(resourceEngagement)
        .set({
          completedAt: existing.completedAt ? null : now,
          viewedAt: existing.viewedAt || now,
        })
        .where(eq(resourceEngagement.id, existing.id));
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

const publishRecordingSchema = z.object({
  sessionId: z.string().min(1, "Session is required"),
  fileKey: z.string().min(1, "Upload a recording file first"),
  title: z.string().trim().max(150).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

/**
 * Publish a session recording as a video resource and notify the cohort.
 * The recording is held (hidden from scholars) until the session has ended.
 */
export async function publishSessionRecording(
  input: unknown,
): Promise<ActionResult> {
  const { user: currentUser } = await requireUser();
  if (currentUser.role !== "admin" && currentUser.role !== "coach") {
    return { ok: false, error: "Only admins and coaches can publish recordings." };
  }

  const parsed = publishRecordingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { sessionId, fileKey, title, description } = parsed.data;

  const session = await getSessionDetail(sessionId);
  if (!session) return { ok: false, error: "Session not found" };
  if (currentUser.role === "coach" && session.coachId !== currentUser.id) {
    return {
      ok: false,
      error: "You can only publish recordings for your own sessions.",
    };
  }

  const releaseAt =
    session.endsAt.getTime() > Date.now() ? session.endsAt : new Date();

  await db.insert(resource).values({
    sessionId,
    cohortId: session.cohortId,
    type: "video",
    title: title && title.length > 0 ? title : `${session.title} — recording`,
    description: description && description.length > 0 ? description : null,
    fileKey,
    availableFrom: releaseAt,
    uploadedBy: currentUser.id,
  });

  // Notify the cohort (best-effort, bounded concurrency for rate safety).
  const scholars = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .innerJoin(scholarEnrollment, eq(scholarEnrollment.scholarId, user.id))
    .where(eq(scholarEnrollment.cohortId, session.cohortId));

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const sessionUrl = `${baseUrl}/sessions/${session.id}`;
  for (let i = 0; i < scholars.length; i += 3) {
    await Promise.allSettled(
      scholars.slice(i, i + 3).map((scholar) =>
        sendSessionRecordingEmail({
          to: scholar.email,
          recipientName: scholar.name,
          sessionTitle: session.title,
          sessionUrl,
          userId: scholar.id,
        }),
      ),
    );
  }

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
