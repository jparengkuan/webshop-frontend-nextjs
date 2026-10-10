import type { AccessTokenProvider } from "@/core/http/http-client";

/** Where the app token comes from; OAuthClient implements it with the Client Credentials grant. */
export interface AppTokenSource {
  clientCredentials(): Promise<{ accessToken: string; expiresIn: number } | null>;
}

/** Renew this long before the token expires, so a request never travels with a dying token. */
const EXPIRY_MARGIN_MS = 60_000;

/**
 * The shop's own access token as a registered API consumer (client id + secret), for data that isn't
 * about a customer, such as the catalog. Cached in memory until shortly before it expires; concurrent
 * requests share one token request.
 */
export class ClientCredentialsTokenProvider implements AccessTokenProvider {
  private token: { value: string; expiresAt: number } | null = null;
  private pending: Promise<string | null> | null = null;

  constructor(
    private readonly source: AppTokenSource,
    private readonly now: () => number = () => performance.timeOrigin + performance.now(),
  ) {}

  async getAccessToken(): Promise<string | null> {
    if (this.token && this.token.expiresAt > this.now()) return this.token.value;
    this.pending ??= this.fetchToken().finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  invalidate(): void {
    this.token = null;
  }

  private async fetchToken(): Promise<string | null> {
    const tokens = await this.source.clientCredentials();
    if (!tokens) throw new Error("The API refused the shop's client credentials; check OAUTH_CLIENT_ID/SECRET.");
    this.token = { value: tokens.accessToken, expiresAt: this.now() + tokens.expiresIn * 1000 - EXPIRY_MARGIN_MS };
    return tokens.accessToken;
  }
}
