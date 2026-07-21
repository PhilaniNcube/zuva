import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/rbac";
import { objectKey, presignPut } from "@/lib/r2";

const schema = z.object({
  filename: z.string().min(1, "filename is required"),
  contentType: z.string().min(1),
  purpose: z.enum(["submission", "resource", "returned"]),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { filename, contentType, purpose } = parsed.data;
  const role = session.user.role;
  const userId = session.user.id;

  // Role validation per purpose.
  if (purpose === "returned" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (purpose === "resource" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // The uploader is always the current user; returned files are uploaded by
  // admin but tracked under the submission — the key contains the admin id
  // only for routing, real ownership is checked at download via the DB.
  const key = objectKey(purpose, userId, filename);

  const uploadUrl = await presignPut(key, contentType);
  if (!uploadUrl) {
    return NextResponse.json(
      {
        error:
          "File storage is not configured (R2 credentials missing). Contact the development team.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ uploadUrl, key });
}
