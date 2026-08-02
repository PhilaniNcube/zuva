import "server-only";

import { cache } from "react";
import { asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { scholarProfile, user } from "@/lib/db/schema";
import { requireRole } from "@/lib/rbac";

export const getScholarProfile = cache(async (userId: string) => {
  const [row] = await db
    .select()
    .from(scholarProfile)
    .where(eq(scholarProfile.userId, userId));
  return row ?? null;
});

export const getUsersForAdmin = cache(async () => {
  await requireRole("admin");
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));
  return users;
});

/** Programme team (admin + MINDS) — hosts for onboarding 1:1 sessions. */
export const listProgrammeTeam = cache(async () => {
  return db
    .select({ id: user.id, name: user.name, role: user.role })
    .from(user)
    .where(inArray(user.role, ["admin", "minds"]))
    .orderBy(asc(user.name));
});
