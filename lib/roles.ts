/**
 * Role definitions shared by server and client code.
 * (No server-only imports allowed in this file.)
 */

export const ROLES = ["scholar", "coach", "admin", "minds"] as const;

export type Role = (typeof ROLES)[number];

/**
 * Where each role lands after login, and where they are sent if they stray.
 * Note: route groups like (admin) do not appear in URLs — these are the
 * real paths.
 */
export const ROLE_HOME: Record<Role, string> = {
  scholar: "/pathway",
  coach: "/availability",
  admin: "/dashboard",
  minds: "/approvals",
};

export function roleHome(role: string): string {
  return ROLE_HOME[(role as Role) in ROLE_HOME ? (role as Role) : "scholar"];
}
