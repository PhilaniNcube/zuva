/**
 * Shared (client-safe) attendance types. Kept out of the server-only
 * `session-queries.ts` so client components can import the shape without
 * pulling in server code.
 */
export type AttendanceRosterEntry = {
  scholarId: string;
  name: string;
  email: string;
  joinedAt: Date | null;
  source: "join_click" | "manual_admin" | null;
};
