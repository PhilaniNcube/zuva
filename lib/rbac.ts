import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";
import { roleHome, type Role } from "./roles";

/**
 * Server-side RBAC enforcement. Use in layouts (route-group guards) and at
 * the top of every server action. The proxy (proxy.ts) is only an optimistic
 * first gate — these helpers are the real check.
 */

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Redirects to /login when unauthenticated; returns the session otherwise. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Redirects unauthenticated users to /login, and users with the wrong role to
 * their own role's home. Returns the session when the role is allowed.
 */
export async function requireRole(...roles: Role[]) {
  const session = await requireUser();
  const role = session.user.role as Role;
  if (!roles.includes(role)) redirect(roleHome(role));
  return session;
}
