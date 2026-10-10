import { createHash, randomBytes } from "node:crypto";

/** PKCE (RFC 7636) with S256: proves that whoever redeems the code also started the login. */
export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: challengeFor(verifier) };
}

export function challengeFor(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function randomState(): string {
  return randomBytes(16).toString("base64url");
}
