import { z } from "zod";
import type { AuthorizationFlow, TokenSet } from "../domain/types";

/**
 * The session lives in httpOnly cookies: browser scripts never see a token. These are plain cookie
 * descriptions, so route handlers and the proxy can set them on any response.
 */

export const SESSION_COOKIES = {
  access: "webshop_access",
  refresh: "webshop_refresh",
  flow: "webshop_oauth_flow",
} as const;

export type CookieDefinition = {
  name: string;
  value: string;
  httpOnly: true;
  secure: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30;
const FLOW_TTL = 60 * 10;

function cookie(name: string, value: string, maxAge: number): CookieDefinition {
  return { name, value, httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge };
}

/** The access cookie expires a minute before the token, so the proxy refreshes it in time. */
export function sessionCookies(tokens: TokenSet): CookieDefinition[] {
  return [
    cookie(SESSION_COOKIES.access, tokens.accessToken, Math.max(60, tokens.expiresIn - 60)),
    cookie(SESSION_COOKIES.refresh, tokens.refreshToken, REFRESH_TOKEN_TTL),
  ];
}

export function flowCookie(flow: AuthorizationFlow): CookieDefinition {
  return cookie(SESSION_COOKIES.flow, JSON.stringify(flow), FLOW_TTL);
}

const flowSchema = z.object({ state: z.string(), verifier: z.string(), returnTo: z.string() });

export function parseFlowCookie(value: string | undefined): AuthorizationFlow | null {
  if (!value) return null;
  try {
    const parsed = flowSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Anything with a cookie jar that can delete: NextResponse.cookies, or next/headers' cookies(). */
type CookieJar = { delete(name: string): unknown };

export function clearSession(cookies: CookieJar): void {
  cookies.delete(SESSION_COOKIES.access);
  cookies.delete(SESSION_COOKIES.refresh);
}
