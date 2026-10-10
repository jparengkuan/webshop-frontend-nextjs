import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { AccessTokenProvider } from "@/core/http/http-client";
import { SESSION_COOKIES } from "./session-cookies";

/** Reads the customer's access token from the session cookie of the current request. */
export class CookieAccessTokenProvider implements AccessTokenProvider {
  async getAccessToken(): Promise<string | null> {
    // Customer data is per request and never prerendered: say so explicitly, before any I/O.
    await connection();
    return (await cookies()).get(SESSION_COOKIES.access)?.value ?? null;
  }
}
