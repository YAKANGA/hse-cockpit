import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "./auth.config";

// Edge-compatible auth — uses only authConfig (no better-sqlite3, no bcrypt)
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/api/auth", "/_next", "/favicon"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Auth protection ────────────────────────────────────────
  if (!PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const session = await auth();

    if (!session?.user) {
      // Allow demo mode via legacy x-user-id header
      const legacyUserId = request.headers.get("x-user-id");
      if (!legacyUserId) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    // Forward NextAuth identity to API routes via headers
    const headers = new Headers(request.headers);
    if (session.user.id)    headers.set("x-user-id",    session.user.id);
    if (session.user.email) headers.set("x-user-email", session.user.email);
    const role = (session.user as Record<string, unknown>).role as string | undefined;
    if (role) headers.set("x-user-role", role);

    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
