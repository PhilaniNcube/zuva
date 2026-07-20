/** Standard return shape for server actions that can fail. */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
