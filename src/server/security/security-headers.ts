/**
 * Security headers for every response (set in next.config.ts).
 *
 * The CSP allows 'unsafe-inline' scripts because Next.js inlines its bootstrap scripts; a strict,
 * nonce-based CSP would make every page dynamic and give up the static shell. Everything else is
 * locked down: no framing, no plugins, connections only to this origin, and forms may only post here
 * or redirect to the API (browsers apply form-action to the redirect after the logout form).
 */
export function securityHeaders({ isDev, apiOrigin }: { isDev: boolean; apiOrigin: string }): {
  key: string;
  value: string;
}[] {
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    // Dev: the HMR websocket.
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    `form-action 'self' ${apiOrigin}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    // Other sites may not embed or read this app's responses.
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ];
}
