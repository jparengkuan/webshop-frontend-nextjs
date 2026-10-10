import { NextResponse } from "next/server";
import { clearSession } from "@/features/auth/server/session-cookies";
import { container } from "@/server/container";

/**
 * Logs out in two steps: this shop forgets the tokens, then the browser goes to the API's /logout to
 * end the login session there too, so the next login asks for the password again. The API sends the
 * user back to the shop. POST only, and the proxy refuses cross-origin POSTs, so another site can't
 * log a customer out.
 */
export function POST() {
  const response = NextResponse.redirect(container.oauth().endSessionUrl(), 303);
  clearSession(response.cookies);
  return response;
}
