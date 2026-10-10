import { describe, expect, it } from "vitest";
import { checkOrigin } from "./origin-policy";
import { securityHeaders } from "./security-headers";

const APP = "https://shop.test";

function request(method: string, headers: Record<string, string> = {}) {
  return { method, headers: new Headers(headers) };
}

describe("origin policy", () => {
  it("allows reads from anywhere (links, Stripe's redirect back)", () => {
    expect(checkOrigin(request("GET", { "sec-fetch-site": "cross-site" }), [APP]).allowed).toBe(true);
  });

  it("allows same-origin writes", () => {
    expect(checkOrigin(request("POST", { origin: APP, "sec-fetch-site": "same-origin" }), [APP]).allowed).toBe(true);
  });

  it("blocks cross-site writes (CSRF)", () => {
    expect(checkOrigin(request("POST", { origin: "https://evil.test" }), [APP]).allowed).toBe(false);
    expect(checkOrigin(request("POST", { "sec-fetch-site": "cross-site" }), [APP]).allowed).toBe(false);
    expect(checkOrigin(request("DELETE", { "sec-fetch-site": "same-site" }), [APP]).allowed).toBe(false);
  });

  it("refuses CORS preflights from other origins", () => {
    expect(checkOrigin(request("OPTIONS", { origin: "https://evil.test" }), [APP]).allowed).toBe(false);
  });
});

describe("security headers", () => {
  const byName = (isDev: boolean) =>
    new Map(securityHeaders({ isDev, apiOrigin: "https://api.test" }).map(({ key, value }) => [key, value]));

  it("forbids framing and foreign form targets", () => {
    const csp = byName(false).get("Content-Security-Policy")!;
    expect(csp).toContain("frame-ancestors 'none'");
    // The API is allowed: the logout form redirects there to end the login session.
    expect(csp).toContain("form-action 'self' https://api.test;");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("only relaxes the CSP for the dev server", () => {
    expect(byName(true).get("Content-Security-Policy")).toContain("'unsafe-eval'");
  });

  it("sets the standard hardening headers", () => {
    const headers = byName(false);
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
    expect(headers.has("Access-Control-Allow-Origin")).toBe(false);
  });
});
