import "server-only";
import { getApiConfig, getAuthConfig } from "@/config/env";
import { BearerTokenHttpClient, FetchHttpClient, type HttpClient } from "@/core/http/http-client";
import { ApiCatalogRepository, type CatalogRepository } from "@/features/catalog/data/catalog-repository";
import { ApiCustomerRepository, type CustomerRepository } from "@/features/auth/data/customer-repository";
import { ClientCredentialsTokenProvider } from "@/features/auth/server/client-credentials-token-provider";
import { CookieAccessTokenProvider } from "@/features/auth/server/cookie-token-provider";
import { OAuthClient } from "@/features/auth/server/oauth-client";
import { CheckoutService } from "@/features/checkout/checkout-service";
import { ApiOrderRepository } from "@/features/checkout/data/order-repository";
import { ApiPaymentGateway } from "@/features/checkout/data/payment-gateway";

/**
 * Composition root: the one place that knows which implementation backs which interface.
 * Everything else asks for what it needs here (or receives it via its constructor), so swapping
 * the API, adding caching or faking a dependency in a test is a change in one file.
 *
 * The API only answers registered consumers, so every request carries a token:
 * - appApi: the shop's own app token (client id + secret), for data that isn't about a customer;
 * - customerApi: the logged-in customer's token from the session cookie.
 */

const oauth = (): OAuthClient => {
  const { clientId, clientSecret, redirectUri } = getAuthConfig();
  return new OAuthClient({ issuer: getApiConfig().baseUrl, clientId, clientSecret, redirectUri });
};

const api = (): HttpClient => new FetchHttpClient(`${getApiConfig().baseUrl}/api`);

/** One per server process: the app token is shared by all requests until it nearly expires. */
let appTokens: ClientCredentialsTokenProvider | undefined;
const appApi = (): HttpClient =>
  new BearerTokenHttpClient(api(), (appTokens ??= new ClientCredentialsTokenProvider(oauth())));

/** Per request: reads the current request's session cookie. */
const customerApi = (): HttpClient => new BearerTokenHttpClient(api(), new CookieAccessTokenProvider());

export const container = {
  catalog: (): CatalogRepository => new ApiCatalogRepository(appApi()),

  customers: (): CustomerRepository => new ApiCustomerRepository(customerApi()),

  checkout: (): CheckoutService => {
    const http = customerApi();
    return new CheckoutService(new ApiOrderRepository(http), new ApiPaymentGateway(http));
  },

  oauth,
};
