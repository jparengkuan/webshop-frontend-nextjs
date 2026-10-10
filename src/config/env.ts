import "server-only";
import { z } from "zod";
import { DEFAULT_API_URL } from "./defaults";

/**
 * Server-side configuration, validated once on first use so a missing or malformed variable fails
 * loudly with a clear message instead of as a confusing runtime error deep in a request.
 * Split per concern: browsing the catalog shouldn't require the OAuth2 secret.
 */

const url = z.url().transform((value) => value.replace(/\/+$/, ""));

const apiSchema = z.object({
  API_URL: url.default(DEFAULT_API_URL),
});

const authSchema = z.object({
  // DDEV sets DDEV_PRIMARY_URL inside the web container.
  APP_URL: url,
  OAUTH_CLIENT_ID: z.string().min(1),
  OAUTH_CLIENT_SECRET: z.string().min(1),
});

export type ApiConfig = { baseUrl: string };

export type AuthConfig = {
  appUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

function parse<T extends z.ZodType>(schema: T, input: Record<string, unknown>): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** Empty strings count as "not set", so defaults apply to `API_URL=` lines too. */
function read(name: string): string | undefined {
  return process.env[name] || undefined;
}

let apiConfig: ApiConfig | undefined;
let authConfig: AuthConfig | undefined;

export function getApiConfig(): ApiConfig {
  apiConfig ??= { baseUrl: parse(apiSchema, { API_URL: read("API_URL") }).API_URL };
  return apiConfig;
}

export function getAuthConfig(): AuthConfig {
  if (!authConfig) {
    const env = parse(authSchema, {
      APP_URL: read("APP_URL") ?? read("DDEV_PRIMARY_URL"),
      OAUTH_CLIENT_ID: read("OAUTH_CLIENT_ID"),
      OAUTH_CLIENT_SECRET: read("OAUTH_CLIENT_SECRET"),
    });
    authConfig = {
      appUrl: env.APP_URL,
      clientId: env.OAUTH_CLIENT_ID,
      clientSecret: env.OAUTH_CLIENT_SECRET,
      redirectUri: `${env.APP_URL}/callback`,
    };
  }
  return authConfig;
}
