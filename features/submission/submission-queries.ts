import "server-only";

import { cache } from "react";
import { desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  submission as submissionTable,
  user,
} from "@/lib/db/schema";

export const listScholarSubmissions = cache(async (scholarId: string) => {
  const rows = await db
    .select({
      id: submissionTable.id,
      title: submissionTable.title,
      status: submissionTable.status,
      createdAt: submissionTable.createdAt,
      dueAt: submissionTable.dueAt,
      returnedFileKey: submissionTable.returnedFileKey,
      reviewerName: user.name,
    })
    .from(submissionTable)
    .leftJoin(user, eq(user.id, submissionTable.reviewerId))
    .where(eq(submissionTable.scholarId, scholarId))
    .orderBy(desc(submissionTable.createdAt));
  return rows;
});

export const listEditingQueue = cache(async (status?: string | null) => {
  const base = db
    .select({
      id: submissionTable.id,
      title: submissionTable.title,
      status: submissionTable.status,
      createdAt: submissionTable.createdAt,
      dueAt: submissionTable.dueAt,
      scholarId: submissionTable.scholarId,
      reviewerId: submissionTable.reviewerId,
      editorId: submissionTable.editorId,
    })
    .from(submissionTable)
    .orderBy(desc(submissionTable.createdAt));

  const q = status
    ? base.where(eq(submissionTable.status, sql`${status}`))
    : base;
  const rows = await q;

  const userIds = new Set<string>();
  for (const r of rows) {
    userIds.add(r.scholarId);
    if (r.reviewerId) userIds.add(r.reviewerId);
    if (r.editorId) userIds.add(r.editorId);
  }

  const users = userIds.size
    ? await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, [...userIds]))
    : [];
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return rows.map((r) => ({
    ...r,
    scholarName: userMap.get(r.scholarId) ?? "Unknown",
    reviewerName: r.reviewerId ? userMap.get(r.reviewerId) ?? null : null,
    editorName: r.editorId ? userMap.get(r.editorId) ?? null : null,
  }));
});

export const getSubmission = cache(async (id: string) => {
  const [row] = await db
    .select()
    .from(submissionTable)
    .where(eq(submissionTable.id, id));
  return row ?? null;
});
