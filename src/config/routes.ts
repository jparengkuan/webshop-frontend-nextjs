/** Single source of truth for the app's URLs; never hand-build a path in a component. */
export const routes = {
  home: (page = 1) => withPage("/", page),
  category: (slug: string, page = 1) => withPage(`/categorie/${slug}`, page),
  product: (id: string) => `/product/${id}`,
  cart: () => "/winkelwagen",
  checkout: () => "/afrekenen",
  orderSuccess: (orderId: string) => `/checkout/success?order=${orderId}`,
  orderCancelled: (orderId: string) => `/checkout/cancelled?order=${orderId}`,
  login: (returnTo?: string) => (returnTo ? `/inloggen?${new URLSearchParams({ returnTo })}` : "/inloggen"),
  loginFailed: () => "/inloggen/mislukt",
  logout: () => "/uitloggen",
} as const;

/** Paths only a logged-in customer can open; the proxy sends everyone else to the login. */
export const protectedPaths = ["/afrekenen", "/checkout"] as const;

export function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function withPage(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path;
}
