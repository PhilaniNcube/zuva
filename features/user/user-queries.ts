import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { scholarProfile } from "@/lib/db/schema";

export const getScholarProfile = cache(async (userId: string) => {
  const [row] = await db
    .select()
    .from(scholarProfile)
    .where(eq(scholarProfile.userId, userId));
  return row ?? null;
});
