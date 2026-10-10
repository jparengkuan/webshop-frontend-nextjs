export type Customer = { id: string; email: string; firstName: string; lastName: string };

export type TokenSet = { accessToken: string; refreshToken: string; expiresIn: number };

/** What the login remembers between leaving for the API and coming back on /callback. */
export type AuthorizationFlow = { state: string; verifier: string; returnTo: string };

/** Only same-site paths, so a crafted link can't send the user to another site after login. */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
