import { NextRequest, NextResponse } from "next/server";
import { or, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { certificate, resource, scholarProfile, submission } from "@/lib/db/schema";
import { presignGet } from "@/lib/r2";
import { getSession } from "@/lib/rbac";

/**
 * Redirects to a presigned download URL for the given file key.
 * Permission checks: submission owners/coaches/admin, resource cohort
 * members/admin/coach.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  // Check submissions
  const [sub] = await db
    .select()
    .from(submission)
    .where(or(eq(submission.fileKey, key), eq(submission.returnedFileKey, key)));

  if (sub) {
    const isOwner = sub.scholarId === session.user.id;
    const isReviewerOrEditor =
      sub.reviewerId === session.user.id || sub.editorId === session.user.id;
    const isAdmin = session.user.role === "admin";
    if (!isOwner && !isReviewerOrEditor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const url = await presignGet(key);
    if (!url) {
      return NextResponse.json(
        { error: "File storage not available" },
        { status: 503 },
      );
    }
    return NextResponse.redirect(url);
  }

  // Check resources
  const [res] = await db
    .select()
    .from(resource)
    .where(eq(resource.fileKey, key));
  if (res) {
    if (session.user.role === "scholar") {
      const [profile] = await db
        .select()
        .from(scholarProfile)
        .where(eq(scholarProfile.userId, session.user.id));
      const allowed =
        !res.cohortId || // global resource
        profile?.cohortId === res.cohortId;
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    const url = await presignGet(key);
    if (!url) {
      return NextResponse.json(
        { error: "File storage not available" },
        { status: 503 },
      );
    }
    return NextResponse.redirect(url);
  }

  // Check certificates (scholars download their own)
  const [cert] = await db
    .select()
    .from(certificate)
    .where(eq(certificate.pdfFileKey, key));
  if (cert) {
    if (cert.scholarId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const url = await presignGet(key);
    if (!url) {
      return NextResponse.json(
        { error: "File storage not available" },
        { status: 503 },
      );
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.json({ error: "File not found" }, { status: 404 });
}
