import { describe, expect, it } from "vitest";
import { isProtectedPath, routes } from "./routes";

describe("routes", () => {
  it("leaves page 1 out of the URL", () => {
    expect(routes.category("audio")).toBe("/categorie/audio");
    expect(routes.category("audio", 2)).toBe("/categorie/audio?page=2");
    expect(routes.home(1)).toBe("/");
  });

  it("encodes the login's return path", () => {
    expect(routes.login("/checkout/success?order=1")).toBe("/inloggen?returnTo=%2Fcheckout%2Fsuccess%3Forder%3D1");
  });

  it("knows which pages need a login", () => {
    expect(isProtectedPath("/afrekenen")).toBe(true);
    expect(isProtectedPath("/checkout/success")).toBe(true);
    expect(isProtectedPath("/checkouts")).toBe(false);
    expect(isProtectedPath("/winkelwagen")).toBe(false);
  });
});
