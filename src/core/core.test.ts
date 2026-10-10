import { describe, expect, it, vi } from "vitest";
import { ApiError, nullIfNotFound, toApiError, UnauthorizedError } from "./http/api-error";
import { BearerTokenHttpClient, FetchHttpClient, type HttpClient } from "./http/http-client";
import { isUuid, parsePageParam, toPaginated } from "./http/hydra";
import { formatMoney, sumMoney } from "./money";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("money", () => {
  it("formats cents in Dutch notation", () => {
    // Intl puts a non-breaking space between symbol and amount.
    expect(formatMoney({ amount: 4995, currency: "EUR" })).toBe("€ 49,95");
  });

  it("refuses to add different currencies", () => {
    expect(() =>
      sumMoney([
        { amount: 1, currency: "EUR" },
        { amount: 1, currency: "USD" },
      ]),
    ).toThrow();
  });
});

describe("hydra", () => {
  it("maps a collection to a page", () => {
    const page = toPaginated({ member: [1, 2], totalItems: 61 }, (n) => n * 10, 2, 30);
    expect(page).toEqual({ items: [10, 20], page: 2, totalItems: 61, totalPages: 3 });
  });

  it.each([
    [undefined, 1],
    ["3", 3],
    [["4", "5"], 4],
    ["-1", 1],
    ["1.5", 1],
    ["abc", 1],
  ])("parses page %j as %i", (input, expected) => {
    expect(parsePageParam(input)).toBe(expected);
  });

  it("recognises UUIDs", () => {
    expect(isUuid("01a0e55f-704e-75cd-aafc-ca3fc445e2c4")).toBe(true);
    expect(isUuid("../../etc/passwd")).toBe(false);
  });
});

describe("api errors", () => {
  it("reads the problem detail", async () => {
    const error = await toApiError(json({ detail: "Insufficient stock" }, 422));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Insufficient stock");
    expect(error.isRejection).toBe(true);
  });

  it("maps 401 to UnauthorizedError", async () => {
    expect(await toApiError(new Response(null, { status: 401 }))).toBeInstanceOf(UnauthorizedError);
  });

  it("turns 404 into null and rethrows anything else", async () => {
    await expect(nullIfNotFound(Promise.reject(new ApiError(404, "gone")))).resolves.toBeNull();
    await expect(nullIfNotFound(Promise.reject(new ApiError(500, "boom")))).rejects.toThrow("boom");
  });
});

describe("http clients", () => {
  it("speaks JSON-LD and throws ApiError on failure", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ ok: 1 }))
      .mockResolvedValueOnce(json({}, 500));
    const client = new FetchHttpClient("https://api.test/api", fetchFn);

    await expect(client.post("/orders", { a: 1 }, { headers: { "Idempotency-Key": "k" } })).resolves.toEqual({ ok: 1 });
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe("https://api.test/api/orders");
    expect(init?.headers).toMatchObject({ "Content-Type": "application/ld+json", "Idempotency-Key": "k" });

    await expect(client.get("/x")).rejects.toBeInstanceOf(ApiError);
  });

  it("decorates requests with the bearer token", async () => {
    const inner: HttpClient = { get: vi.fn().mockResolvedValue("ok"), post: vi.fn() };
    const client = new BearerTokenHttpClient(inner, { getAccessToken: async () => "t0k3n" });

    await client.get("/me");

    expect(inner.get).toHaveBeenCalledWith("/me", { headers: { Authorization: "Bearer t0k3n" } });
  });

  it("refuses to call the API without a token", async () => {
    const client = new BearerTokenHttpClient({ get: vi.fn(), post: vi.fn() }, { getAccessToken: async () => null });
    await expect(client.get("/me")).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
