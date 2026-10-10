# Webshop frontend (Next.js)

Storefront for the [API Platform webshop backend](../api-platform): catalog, cart, login through the
API's OAuth2 server and checkout with Stripe. Next.js 16 (App Router, Cache Components, Partial
Prerendering), React 19, Tailwind CSS 4, TypeScript in strict mode, zod, Vitest.

## Getting started

Both projects run in DDEV. Start the backend first, then this app:

```bash
(cd ../api-platform && ddev start)
ddev start            # installs packages and runs `next dev` in the web container
ddev launch           # https://webshop-frontend-nextjs.ddev.site
```

Log in as `klant@example.com` / `password` (backend fixtures) and pay with Stripe test card
`4242 4242 4242 4242`. Payments only show as paid when the backend receives Stripe's webhooks (see
the backend README, "Payments").

Run npm through DDEV (`ddev npm install …`, `ddev exec npm run check`) so native packages are built
for Linux. The dev server runs as a DDEV web daemon (`.ddev/config.nextjs.yaml`); `ddev logs -f`
shows its output.

### Configuration

Copy `.env.example` to `.env.local`. Variables are validated with zod on first use
(`src/config/env.ts`), so a missing or malformed one fails with a clear message.

| Variable              | Purpose                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| `API_URL`             | Backend base URL (default `https://api-platform.ddev.site`)            |
| `APP_URL`             | Public URL of this app; inside DDEV `DDEV_PRIMARY_URL` is used instead |
| `OAUTH_CLIENT_ID`     | OAuth2 client registered on the API                                    |
| `OAUTH_CLIENT_SECRET` | Its secret; server-side only, never sent to the browser                |

`API_URL` is also the address browsers are sent to for the login and logout pages, so it must be the
API's public URL.

### What the API needs

For the client in `OAUTH_CLIENT_ID` (the dev fixtures' `webshop-demo` client has all of this):

- the grants `authorization_code`, `refresh_token` and `client_credentials`, scope `api`;
- `APP_URL/callback` as a registered redirect URI;
- the API's `FRONTEND_URL` set to `APP_URL`, so Stripe and the API's logout send customers back here.

```bash
# On the API, for an existing client:
bin/console league:oauth2-server:update-client <client-id> \
  --add-redirect-uri=https://shop.example.com/callback --add-grant-type=client_credentials
```

## Scripts

| Command             | What it does                                                       |
| ------------------- | ------------------------------------------------------------------ |
| `npm run dev`       | Dev server (DDEV runs this for you)                                |
| `npm run build`     | Production build                                                   |
| `npm run check`     | Type check, lint, format check and tests — run before every commit |
| `npm run typecheck` | Generates route types and runs `tsc`                               |
| `npm run test`      | Unit tests (Vitest); `test:watch` while developing                 |
| `npm run lint:fix`  | ESLint with auto-fix                                               |
| `npm run format`    | Prettier (sorts Tailwind classes too)                              |

## Pages

| Path                  | What                                                                      |
| --------------------- | ------------------------------------------------------------------------- |
| `/`                   | Banner, category tiles and all products (paginated)                       |
| `/categorie/[slug]`   | Products in a category                                                    |
| `/product/[id]`       | Product details, add to cart                                              |
| `/winkelwagen`        | Cart (kept in the browser)                                                |
| `/afrekenen`          | Review and place the order — login required                               |
| `/checkout/success`   | Stripe returns here after paying; waits for the webhook, empties the cart |
| `/checkout/cancelled` | Stripe returns here on cancel; pay again within 30 minutes                |
| `/inloggen`           | Route handler: starts the OAuth2 login (`?returnTo=`)                     |
| `/callback`           | Route handler: OAuth2 redirect URI, redeems the code                      |
| `/uitloggen`          | Route handler (POST): ends the session here and on the API                |
| `/inloggen/mislukt`   | Shown when a login was cancelled or expired                               |

### Checkout flow

1. **Winkelwagen** → "Afrekenen" (a full page load, so the login redirect happens in the browser).
2. **Inloggen**: the proxy sends visitors without a session to `/inloggen`, which hands over to the
   API's login page and comes back to `/afrekenen`.
3. **Controleren**: customer details, order lines, total.
4. **Betalen**: a server action places the order (`POST /api/orders` with an `Idempotency-Key`, so a
   retry never orders twice), starts the payment and the browser goes to Stripe's checkout page.

## Architecture

```
src/
├── app/                 Routing only: pages, layouts, route handlers, error and 404 pages
│   └── _components/     Site header and footer
├── config/              env (validated), routes (every URL), site metadata, shared defaults
├── core/                Framework-free building blocks: HTTP client, API errors, Hydra, Money, Result
├── features/
│   ├── catalog/         domain · data (repository) · server (cached queries) · components
│   ├── cart/            domain (pure functions) · store (observable + storage strategy) · hooks · components
│   ├── auth/            domain · data · server (OAuth2 client, token providers, session cookies) · components
│   └── checkout/        domain · data · checkout-service · actions · hooks · components
├── server/
│   ├── container.ts     Composition root: wires implementations to interfaces
│   └── security/        Origin policy (CORS/CSRF) and security headers
├── shared/ui/           Design-system primitives: Button, Card, Alert, Breadcrumbs, Pagination…
└── proxy.ts             Origin check, token refresh, login guard
```

Dependencies point inwards: `app → features → core`. A feature's `domain` has no framework or I/O
imports, so it is unit-tested directly. Server-only modules import `server-only`, so they can never
end up in a browser bundle.

### Principles and patterns

| Where                                   | Pattern / principle                                                                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `core/http/http-client.ts`              | **Adapter** (`FetchHttpClient` adapts `fetch` to `HttpClient`) and **Decorator** (`BearerTokenHttpClient` adds the app's or the customer's token, and retries once with a fresh app token) |
| `features/*/data/*-repository.ts`       | **Repository** + mapper: components get domain objects, never the API's JSON-LD                                                                                                            |
| `features/checkout/checkout-service.ts` | **Service layer** / use cases, depending only on `OrderRepository` and `PaymentGateway` interfaces (**DIP**), tested with fakes                                                            |
| `server/container.ts`                   | **Composition root** / dependency injection: the only place that picks implementations                                                                                                     |
| `features/auth/server/*-provider.ts`    | **Strategy**: `AccessTokenProvider` implemented by the app token (client credentials) and the customer's session cookie                                                                    |
| `features/cart/store`                   | **Observer** (store + `useSyncExternalStore`) and **Strategy** (`CartStorage`: localStorage, in-memory)                                                                                    |
| `core/result.ts`                        | **Result type** for expected failures (out of stock, session expired); bugs still throw                                                                                                    |
| Everywhere                              | **SRP**: one reason to change per module; **OCP**: new storage/payment/API → new class, no edits to callers; **ISP**: small interfaces (`AccessTokenProvider`, `PaymentGateway`)           |

### Rendering and caching

- Catalog data is the same for everyone: `"use cache"` + `cacheLife("minutes")`, tagged `catalog`,
  so pages prerender a static shell and stream the rest (Partial Prerendering). This is also the
  catalog's only cache layer: the API's Varnish passes every request that carries a token.
- Customer data is per request: `CookieAccessTokenProvider` calls `connection()` before reading the
  session, and those components sit inside `<Suspense>`.
- `getCurrentCustomer` is wrapped in React `cache()`, so the header and a page share one API call.

### API access: consumers only

The API answers registered consumers only: every `/api` request carries an access token.

- **Catalog** (products, categories): the shop's own **app token**, from the OAuth2 Client
  Credentials grant with `OAUTH_CLIENT_ID` + `OAUTH_CLIENT_SECRET`. `ClientCredentialsTokenProvider`
  keeps it in memory until a minute before it expires, shares one token request between concurrent
  callers, and fetches a new one once if the API rejects it.
- **Customer data** (profile, orders, payment): the logged-in customer's token (below).

Both run on the server only; the secret and the tokens never reach the browser.

### Authentication

Authorization Code grant with PKCE against the API (`/inloggen` → API login page → `/callback`).
This app is a confidential client: the code is redeemed server-side with the client secret, and the
tokens live in `httpOnly`, `Secure`, `SameSite=Lax` cookies. The proxy renews an expired access token
with the refresh token before rendering. `returnTo` is restricted to same-site paths (no open
redirect) and the OAuth `state` is checked on the callback (no login CSRF).

Logging out (`POST /uitloggen`) clears the tokens and then sends the browser to the API's `/logout`,
which ends the login session there and returns to the shop (`FRONTEND_URL`). Without that second
step the API would still remember the user and the next login would skip the password.

### Security (CORS, CSRF, headers)

- **No CORS surface.** The browser never calls the API; every API call is server-side. The API's CORS
  whitelist therefore stays limited to localhost, and this app sends no `Access-Control-Allow-*`
  headers.
- **Origin policy** (`server/security/origin-policy.ts`, enforced in `proxy.ts`): cross-origin
  preflights and cross-site `POST/PUT/PATCH/DELETE` get `403`, using `Sec-Fetch-Site` and `Origin`.
  This protects route handlers such as `/uitloggen`; server actions also get Next.js' own Origin/Host
  check.
- **Security headers** (`next.config.ts`): CSP (`frame-ancestors 'none'`, `object-src 'none'`,
  `connect-src 'self'`, and `form-action 'self'` plus the API's origin for the logout redirect), HSTS,
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP and CORP.
  Scripts allow `'unsafe-inline'` for Next.js' inline bootstrap; a nonce-based CSP would make every
  page dynamic.
- **Input validation**: server actions validate every argument with zod; the cart read from
  localStorage and the login-flow cookie are validated too.

### Design

Colours are theme tokens in `src/app/globals.css` (`paper`, `surface`, `sunken`, `line`, `ink`,
`muted`, `ok`, `warn`, `danger`), used as Tailwind classes such as `bg-surface` or `text-muted`;
change the palette there, not in components. The font is Schibsted Grotesk via `next/font`.
The API has no product images yet, so `ProductImage` draws a placeholder per category.

## Troubleshooting

| Symptom                                                      | Cause and fix                                                                                        |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Buttons do nothing, "add to cart" doesn't work in dev        | Dev scripts blocked for the DDEV host: `allowedDevOrigins` in `next.config.ts` reads `DDEV_HOSTNAME` |
| Catalog pages error: "refused the shop's client credentials" | Wrong `OAUTH_CLIENT_ID`/`SECRET`, or the client lacks the `client_credentials` grant                 |
| Login ends on `/inloggen/mislukt`                            | `APP_URL/callback` isn't a registered redirect URI, or the login took longer than 10 minutes         |
| After logout, "Inloggen" logs straight back in               | The API's `/logout` wasn't reached; check `API_URL` is the API's public URL                          |
| After paying the order stays "Betaling wordt verwerkt"       | Stripe's webhook doesn't reach the backend (Stripe CLI in development)                               |

## Conventions

- File names in kebab-case; one component or concept per file.
- Import through `@/…`; relative imports only within a feature (ESLint enforces it).
- Build URLs with `routes` from `@/config/routes`, never by hand.
- UI text is Dutch; code, comments and commits are English.
- Tests live next to the code as `*.test.ts`.
