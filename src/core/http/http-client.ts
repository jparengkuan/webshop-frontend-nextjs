import { toApiError, UnauthorizedError } from "./api-error";

export type RequestOptions = { headers?: Record<string, string> };

/** What the data layer needs from HTTP; repositories depend on this, not on fetch. */
export interface HttpClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
}

/** Adapter from HttpClient to fetch, speaking JSON-LD to API Platform. */
export class FetchHttpClient implements HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("POST", path, body, options);
  }

  private async request<T>(method: string, path: string, body: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Accept: "application/ld+json",
        ...(body === undefined ? {} : { "Content-Type": "application/ld+json" }),
        ...options?.headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) throw await toApiError(response);
    return (response.status === 204 ? undefined : await response.json()) as T;
  }
}

export interface AccessTokenProvider {
  getAccessToken(): Promise<string | null>;
  /**
   * Optional: forget a token the API rejected, so the next call fetches a fresh one. Providers that
   * can renew their token themselves (app tokens) implement it; a customer's session can't.
   */
  invalidate?(): void;
}

/**
 * Decorator that adds a bearer token to every request: the shop's app token (as an API consumer)
 * or the logged-in customer's token, depending on the provider.
 */
export class BearerTokenHttpClient implements HttpClient {
  constructor(
    private readonly inner: HttpClient,
    private readonly tokens: AccessTokenProvider,
  ) {}

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.withRetry(async () => this.inner.get<T>(path, await this.withToken(options)));
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.withRetry(async () => this.inner.post<T>(path, body, await this.withToken(options)));
  }

  /** A renewable token the API rejected (revoked, keys rotated) gets one retry with a fresh token. */
  private async withRetry<T>(send: () => Promise<T>): Promise<T> {
    try {
      return await send();
    } catch (error) {
      if (!(error instanceof UnauthorizedError) || !this.tokens.invalidate) throw error;
      this.tokens.invalidate();
      return send();
    }
  }

  private async withToken(options: RequestOptions = {}): Promise<RequestOptions> {
    const token = await this.tokens.getAccessToken();
    if (!token) throw new UnauthorizedError();
    return { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } };
  }
}
