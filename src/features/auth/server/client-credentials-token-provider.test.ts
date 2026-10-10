import { describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/core/http/api-error";
import { BearerTokenHttpClient, type HttpClient } from "@/core/http/http-client";
import { ClientCredentialsTokenProvider, type AppTokenSource } from "./client-credentials-token-provider";

function source(...tokens: string[]): AppTokenSource & { clientCredentials: ReturnType<typeof vi.fn> } {
  const fn = vi.fn();
  tokens.forEach((token) => fn.mockResolvedValueOnce({ accessToken: token, expiresIn: 3600 }));
  return { clientCredentials: fn };
}

describe("ClientCredentialsTokenProvider", () => {
  it("reuses the app token until shortly before it expires", async () => {
    let now = 0;
    const tokens = source("first", "second");
    const provider = new ClientCredentialsTokenProvider(tokens, () => now);

    expect(await provider.getAccessToken()).toBe("first");
    now = 3_500_000; // 58 min 20 s: still more than a minute left
    expect(await provider.getAccessToken()).toBe("first");
    now = 3_550_000; // inside the last minute: renew
    expect(await provider.getAccessToken()).toBe("second");
    expect(tokens.clientCredentials).toHaveBeenCalledTimes(2);
  });

  it("shares one token request between concurrent callers", async () => {
    const tokens = source("only");
    const provider = new ClientCredentialsTokenProvider(tokens, () => 0);

    const results = await Promise.all([provider.getAccessToken(), provider.getAccessToken()]);

    expect(results).toEqual(["only", "only"]);
    expect(tokens.clientCredentials).toHaveBeenCalledOnce();
  });

  it("fails loudly when the API refuses the client credentials", async () => {
    const provider = new ClientCredentialsTokenProvider({ clientCredentials: async () => null });
    await expect(provider.getAccessToken()).rejects.toThrow(/client credentials/);
  });

  it("gets a fresh token once when the API rejects the cached one", async () => {
    const provider = new ClientCredentialsTokenProvider(source("revoked", "fresh"), () => 0);
    const inner: HttpClient = {
      get: vi.fn().mockRejectedValueOnce(new UnauthorizedError()).mockResolvedValueOnce("catalog"),
      post: vi.fn(),
    };

    const result = await new BearerTokenHttpClient(inner, provider).get("/products");

    expect(result).toBe("catalog");
    expect(inner.get).toHaveBeenLastCalledWith("/products", { headers: { Authorization: "Bearer fresh" } });
  });
});
