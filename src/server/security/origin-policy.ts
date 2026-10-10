/**
 * Same-origin policy for this app's own endpoints (route handlers, server actions).
 *
 * The app exposes no cross-origin API: the browser never calls the backend directly, and nothing
 * here sends Access-Control-Allow-* headers. So any state-changing or preflight request that
 * comes from another origin is refused outright, which also blocks CSRF on POST route handlers
 * such as /uitloggen. (Next.js runs its own Origin/Host check on server actions as well.)
 */

const SAFE_METHODS = new Set(["GET", "HEAD"]);

export type OriginCheck = { allowed: true } | { allowed: false; reason: string };

type RequestLike = {
  method: string;
  headers: { get(name: string): string | null };
};

export function checkOrigin(request: RequestLike, allowedOrigins: readonly string[]): OriginCheck {
  const method = request.method.toUpperCase();
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  // CORS preflight: always refuse a foreign origin, so no browser ever gets cross-origin access.
  if (method === "OPTIONS") {
    return origin && !allowedOrigins.includes(origin)
      ? { allowed: false, reason: `Cross-origin preflight from ${origin}` }
      : { allowed: true };
  }

  if (SAFE_METHODS.has(method)) return { allowed: true };

  // Modern browsers say where a request comes from; "same-origin" or a direct visit ("none") is fine.
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return { allowed: false, reason: `Cross-site ${method} (Sec-Fetch-Site: ${fetchSite})` };
  }
  if (origin && !allowedOrigins.includes(origin)) {
    return { allowed: false, reason: `${method} from foreign origin ${origin}` };
  }
  return { allowed: true };
}
