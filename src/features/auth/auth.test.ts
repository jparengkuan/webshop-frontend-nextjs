import { describe, expect, it, vi } from "vitest";
import { safeReturnTo } from "./domain/types";
import { OAuthClient } from "./server/oauth-client";
import { challengeFor } from "./server/pkce";
import { flowCookie, parseFlowCookie, sessionCookies } from "./server/session-cookies";

const config = {
  issuer: "https://api.test",
  clientId: "shop",
  clientSecret: "secret",
  redirectUri: "https://shop.test/callback",
};

describe("safeReturnTo", () => {
  it.each([
    ["/afrekenen", "/afrekenen"],
    ["/checkout/success?order=1", "/checkout/success?order=1"],
    ["https://evil.test", "/"],
    ["//evil.test", "/"],
    ["/\\evil.test", "/"],
    [null, "/"],
  ])("%j → %j", (input, expected) => {
    expect(safeReturnTo(input)).toBe(expected);
  });
});

describe("OAuthClient", () => {
  it("starts an Authorization Code + PKCE login", () => {
    const { url, flow } = new OAuthClient(config).startAuthorization("/afrekenen");
    const params = new URL(url).searchParams;

    expect(url).toMatch(/^https:\/\/api\.test\/authorize\?/);
    expect(params.get("client_id")).toBe("shop");
    expect(params.get("redirect_uri")).toBe(config.redirectUri);
    expect(params.get("code_challenge_method")).toBe("S256");
    expect(params.get("code_challenge")).toBe(challengeFor(flow.verifier));
    expect(params.get("state")).toBe(flow.state);
    expect(params.has("client_secret")).toBe(false);
    expect(flow.returnTo).toBe("/afrekenen");
  });

  it("refuses a callback whose state doesn't match", async () => {
    const fetchFn = vi.fn<typeof fetch>();
    const client = new OAuthClient(config, fetchFn);
    const { flow } = client.startAuthorization(null);

    expect(await client.completeAuthorization(flow, { code: "abc", state: "forged" })).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("redeems the code with the verifier and client secret", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ access_token: "a", refresh_token: "r", expires_in: 3600 }));
    const client = new OAuthClient(config, fetchFn);
    const { flow } = client.startAuthorization(null);

    const tokens = await client.completeAuthorization(flow, { code: "abc", state: flow.state });

    expect(tokens).toEqual({ accessToken: "a", refreshToken: "r", expiresIn: 3600 });
    const body = fetchFn.mock.calls[0]![1]!.body as URLSearchParams;
    expect(body.get("code_verifier")).toBe(flow.verifier);
    expect(body.get("client_secret")).toBe("secret");
  });
});

describe("OAuthClient client credentials", () => {
  it("asks /token for an app token with the client id and secret", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ access_token: "app", expires_in: 3600 }));

    expect(await new OAuthClient(config, fetchFn).clientCredentials()).toEqual({ accessToken: "app", expiresIn: 3600 });
    const body = fetchFn.mock.calls[0]![1]!.body as URLSearchParams;
    expect(Object.fromEntries(body)).toEqual({
      grant_type: "client_credentials",
      scope: "api",
      client_id: "shop",
      client_secret: "secret",
    });
  });
});

describe("OAuthClient logout", () => {
  it("ends the API's login session on its /logout page", () => {
    expect(new OAuthClient(config).endSessionUrl()).toBe("https://api.test/logout");
  });
});

describe("session cookies", () => {
  it("are httpOnly, secure and expire the access token early", () => {
    const [access, refresh] = sessionCookies({ accessToken: "a", refreshToken: "r", expiresIn: 3600 });
    expect(access).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", maxAge: 3540 });
    expect(refresh!.maxAge).toBeGreaterThan(access!.maxAge);
  });

  it("round-trips the login flow and rejects tampered values", () => {
    const flow = { state: "s", verifier: "v", returnTo: "/" };
    expect(parseFlowCookie(flowCookie(flow).value)).toEqual(flow);
    expect(parseFlowCookie('{"state":1}')).toBeNull();
    expect(parseFlowCookie("not json")).toBeNull();
    expect(parseFlowCookie(undefined)).toBeNull();
  });
});
