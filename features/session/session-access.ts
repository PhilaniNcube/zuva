import "server-only";

import type { Role } from "@/lib/roles";
import { isScholarEnrolledInCohort } from "@/features/user/user-queries";

import { getConfirmedBooking } from "./session-queries";

/**
 * The subset of a session needed to decide visibility. Matches the shape
 * returned by `getSessionDetail`.
 */
export interface SessionAccessShape {
  id: string;
  cohortId: string;
  coachId: string | null;
  scholarId: string | null;
  format: "group" | "one_on_one";
  kind: "masterclass" | "coaching" | "orientation" | "onboarding";
}

/**
 * Single source of truth for "may this user view this session?".
 *
 * - admins see everything;
 * - coaches and MINDS users see sessions they host (`coachId`);
 * - scholars see targeted 1:1s (booking for coaching, `scholarId` for
 *   onboarding) and group sessions for cohorts they're enrolled in.
 */
export async function canViewSession(
  user: { id: string; role: Role },
  session: SessionAccessShape,
): Promise<boolean> {
  if (user.role === "admin") return true;
  if (user.role === "coach" || user.role === "minds") {
    return session.coachId === user.id;
  }
  if (session.format === "one_on_one") {
    return session.kind === "coaching"
      ? !!(await getConfirmedBooking(session.id, user.id))
      : session.scholarId === user.id;
  }
  return isScholarEnrolledInCohort(user.id, session.cohortId);
}
