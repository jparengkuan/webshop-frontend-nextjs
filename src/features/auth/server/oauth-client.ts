import { safeReturnTo, type AuthorizationFlow, type TokenSet } from "../domain/types";
import { createPkcePair, randomState } from "./pkce";

export type OAuthClientConfig = {
  /** Base URL of the authorization server, e.g. https://api-platform.ddev.site */
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

type TokenResponse = { access_token: string; refresh_token: string; expires_in: number };

/**
 * Confidential OAuth2 client for the API: Authorization Code grant with PKCE, plus refresh.
 * Only runs on the server, as it holds the client secret.
 */
export class OAuthClient {
  constructor(
    private readonly config: OAuthClientConfig,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  /** Starts a login: the URL to send the browser to, and the flow to remember until the callback. */
  startAuthorization(returnTo: string | null): { url: string; flow: AuthorizationFlow } {
    const { verifier, challenge } = createPkcePair();
    const state = randomState();
    const url = new URL("/authorize", this.config.issuer);
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: "api",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    }).toString();

    return { url: url.toString(), flow: { state, verifier, returnTo: safeReturnTo(returnTo) } };
  }

  /** Redeems the code from the callback. Returns null when the state doesn't match or the API refuses. */
  async completeAuthorization(
    flow: AuthorizationFlow,
    callback: { code: string | null; state: string | null },
  ): Promise<TokenSet | null> {
    // The state must match the one this browser started with, so a forged callback can't log someone in.
    if (!callback.code || callback.state !== flow.state) return null;
    return this.requestTokens({
      grant_type: "authorization_code",
      code: callback.code,
      redirect_uri: this.config.redirectUri,
      code_verifier: flow.verifier,
    });
  }

  /** A new token pair; the API rotates the refresh token and revokes the old access token. */
  refresh(refreshToken: string): Promise<TokenSet | null> {
    return this.requestTokens({ grant_type: "refresh_token", refresh_token: refreshToken });
  }

  /**
   * The shop's own app token (Client Credentials grant): proves to the API that requests come from a
   * registered consumer, for data that isn't about a customer.
   */
  async clientCredentials(): Promise<{ accessToken: string; expiresIn: number } | null> {
    const response = await this.fetchFn(new URL("/token", this.config.issuer), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: this.withClientAuth({ grant_type: "client_credentials", scope: "api" }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const { access_token, expires_in }: { access_token: string; expires_in: number } = await response.json();
    return { accessToken: access_token, expiresIn: expires_in };
  }

  /**
   * Where to send the browser to end the login session on the API. Without this the API still
   * remembers the user, and the next login would skip the password. The API sends the user back
   * to the shop afterwards.
   */
  endSessionUrl(): string {
    return new URL("/logout", this.config.issuer).toString();
  }

  private async requestTokens(params: Record<string, string>): Promise<TokenSet | null> {
    const response = await this.fetchFn(new URL("/token", this.config.issuer), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: this.withClientAuth(params),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const tokens: TokenResponse = await response.json();
    return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresIn: tokens.expires_in };
  }

  /** Every request to /token authenticates the client with its id and secret. */
  private withClientAuth(params: Record<string, string>): URLSearchParams {
    return new URLSearchParams({ ...params, client_id: this.config.clientId, client_secret: this.config.clientSecret });
  }
}
