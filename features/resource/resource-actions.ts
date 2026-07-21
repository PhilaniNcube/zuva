"use server";

import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import { resource } from "@/lib/db/schema";
import { deleteObject } from "@/lib/r2";
import { requireRole } from "@/lib/rbac";

const createSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(150),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  fileKey: z.string().min(1, "File key is required"),
  cohortId: z.string().optional().or(z.literal("")),
});

export async function createResource(input: unknown): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { title, description, fileKey, cohortId } = parsed.data;

  await db.insert(resource).values({
    title,
    description: description || null,
    fileKey,
    cohortId: cohortId || null,
    uploadedBy: (await requireRole("admin")).user.id,
  });
  refresh();
  return { ok: true, data: undefined };
}

export async function deleteResource(resourceId: string): Promise<ActionResult> {
  await requireRole("admin");
  const [row] = await db
    .select()
    .from(resource)
    .where(eq(resource.id, resourceId));
  if (!row) return { ok: false, error: "Resource not found" };
  await db.delete(resource).where(eq(resource.id, resourceId));
  if (row.fileKey) await deleteObject(row.fileKey).catch(() => {});
  refresh();
  return { ok: true, data: undefined };
}
