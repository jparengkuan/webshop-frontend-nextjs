import type { NextConfig } from "next";
import { DEFAULT_API_URL } from "./src/config/defaults";
import { securityHeaders } from "./src/server/security/security-headers";

const isDev = process.env.NODE_ENV !== "production";
const apiOrigin = new URL(process.env.API_URL || DEFAULT_API_URL).origin;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // The dev server is reached through DDEV's router (e.g. webshop-frontend-nextjs.ddev.site);
  // without this Next.js blocks its dev scripts there and the page never becomes interactive.
  allowedDevOrigins: process.env.DDEV_HOSTNAME?.split(",") ?? [],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders({ isDev, apiOrigin }) }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
