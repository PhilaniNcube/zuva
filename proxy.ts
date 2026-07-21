import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth gate. Checks only for the *presence* of a session cookie —
 * it cannot validate the session (that happens for real in the route-group
 * layouts via requireRole, and again inside every server action).
 */
export function proxy(request: NextRequest) {
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Everything is private except public auth pages, the auth API, and static assets.
  matcher: [
    "/((?!login|forgot-password|reset-password|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
