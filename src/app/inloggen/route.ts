import { NextResponse, type NextRequest } from "next/server";
import { flowCookie } from "@/features/auth/server/session-cookies";
import { container } from "@/server/container";

/** Starts the login: remembers state, PKCE verifier and return path, then hands over to the API. */
export function GET(request: NextRequest) {
  const { url, flow } = container.oauth().startAuthorization(request.nextUrl.searchParams.get("returnTo"));

  const response = NextResponse.redirect(url);
  response.cookies.set(flowCookie(flow));
  return response;
}
