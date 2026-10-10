import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig } from "@/config/env";
import { isProtectedPath, routes } from "@/config/routes";
import { clearSession, SESSION_COOKIES, sessionCookies } from "@/features/auth/server/session-cookies";
import { container } from "@/server/container";
import { checkOrigin } from "@/server/security/origin-policy";

/**
 * Runs before every page and route handler:
 * 1. refuses cross-origin writes and preflights (this app offers no CORS),
 * 2. renews an expired access token (server components can read cookies, not set them),
 * 3. sends visitors of protected pages to the login.
 */
export async function proxy(request: NextRequest) {
  const { appUrl } = getAuthConfig();

  const origin = checkOrigin(request, [appUrl]);
  if (!origin.allowed) {
    return new NextResponse(null, { status: 403, statusText: "Forbidden" });
  }

  const hasAccessToken = request.cookies.has(SESSION_COOKIES.access);
  const refreshToken = request.cookies.get(SESSION_COOKIES.refresh)?.value;

  if (!hasAccessToken && refreshToken) {
    const tokens = await container.oauth().refresh(refreshToken);
    if (tokens) {
      const cookies = sessionCookies(tokens);
      // Visible to this request's rendering, and stored in the browser.
      cookies.forEach(({ name, value }) => request.cookies.set(name, value));
      const response = NextResponse.next({ request });
      cookies.forEach((cookie) => response.cookies.set(cookie));
      return response;
    }
    // Refresh token expired or revoked: the visitor is logged out.
    const response = guard(request, appUrl);
    clearSession(response.cookies);
    return response;
  }

  return hasAccessToken ? NextResponse.next() : guard(request, appUrl);
}

function guard(request: NextRequest, appUrl: string): NextResponse {
  const { pathname, search } = request.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();
  return NextResponse.redirect(new URL(routes.login(pathname + search), appUrl));
}

export const config = {
  // Everything except static assets; the login routes still pass the origin check.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
