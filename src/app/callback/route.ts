import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig } from "@/config/env";
import { routes } from "@/config/routes";
import { parseFlowCookie, SESSION_COOKIES, sessionCookies } from "@/features/auth/server/session-cookies";
import { container } from "@/server/container";

/** The API sends the user back here with a code; it's redeemed on the server, never in the browser. */
export async function GET(request: NextRequest) {
  const { appUrl } = getAuthConfig();
  const flow = parseFlowCookie(request.cookies.get(SESSION_COOKIES.flow)?.value);

  const tokens = flow
    ? await container.oauth().completeAuthorization(flow, {
        code: request.nextUrl.searchParams.get("code"),
        state: request.nextUrl.searchParams.get("state"),
      })
    : null;

  const response = NextResponse.redirect(new URL(tokens && flow ? flow.returnTo : routes.loginFailed(), appUrl));
  response.cookies.delete(SESSION_COOKIES.flow);
  if (tokens) sessionCookies(tokens).forEach((cookie) => response.cookies.set(cookie));
  return response;
}
