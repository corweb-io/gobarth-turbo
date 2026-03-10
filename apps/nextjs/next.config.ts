import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextSafe = require("next-safe") as (
  options: Record<string, unknown>,
) => Array<{ key: string; value: string }>;

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        source: "/(.*)",
        headers: nextSafe({
          isDev,
          contentSecurityPolicy: {
            "default-src": ["'self'"],
            "script-src": [
              "'self'",
              "'unsafe-inline'",
              "https://*.posthog.com",
              "https://*.sentry.io",
            ],
            "connect-src": [
              "'self'",
              "https://*.supabase.co",
              "https://*.posthog.com",
              "https://*.sentry.io",
              "https://*.axiom.co",
              "https://api.resend.com",
            ],
            "img-src": ["'self'", "data:", "https://*.supabase.co"],
            "frame-ancestors": ["'none'"],
          },
          permissionsPolicy: {
            camera: [],
            microphone: [],
            geolocation: [],
          },
        }),
      },
    ];
  },
  transpilePackages: [
    "@my-app/api",
    "@my-app/auth",
    "@my-app/db",
    "@my-app/ui-web",
    "@my-app/validators",
    "@my-app/i18n",
  ],
};

export default withBundleAnalyzer(nextConfig);
