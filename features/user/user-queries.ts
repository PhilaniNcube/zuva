import "server-only";

import { cache } from "react";
import { desc, eq } from "drizzle-orm";

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
