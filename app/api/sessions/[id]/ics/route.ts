import { NextResponse } from "next/server";

import { buildSessionIcs } from "@/lib/ics";
import { getSession } from "@/lib/rbac";
import type { Role } from "@/lib/roles";
import { canViewSession } from "@/features/session/session-access";
import { getSessionDetail } from "@/features/session/session-queries";

/**
 * `GET /api/sessions/[id]/ics` — download an iCalendar file for a session.
 * Access mirrors the session detail page.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authSession = await getSession();
  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const session = await getSessionDetail(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const allowed = await canViewSession(
    { id: authSession.user.id, role: authSession.user.role as Role },
    session,
  );
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const description = [
    session.description,
    session.meetLink ? `Join video call: ${session.meetLink}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join("\n\n");

  const ics = buildSessionIcs({
    uid: session.id,
    title: session.title,
    description,
    location: session.meetLink,
    url: `${origin}/sessions/${session.id}`,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="zuva-session.ics"',
      "Cache-Control": "no-store",
    },
  });
}
