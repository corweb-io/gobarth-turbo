# Final Production Hardening — Scaffold Instructions
> This is the fourth and final companion document. Apply after the first three scaffold documents are complete.

---

## 1. Structured Server Logging — Pino + Axiom

Sentry catches exceptions. Logging tells you what your server was doing before things went wrong. Without structured logs, debugging production issues that are not errors is nearly impossible.

### 1.1 Install

```bash
pnpm add pino pino-axiom --filter @my-app/api
pnpm add @axiomhq/nextjs --filter @my-app/nextjs
```

### 1.2 `packages/api/src/lib/logger.ts`

```ts
import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: isProduction ? "info" : "debug",
  ...(isProduction
    ? {
        transport: {
          target: "pino-axiom",
          options: {
            dataset: process.env.AXIOM_DATASET!,
            token: process.env.AXIOM_TOKEN!,
          },
        },
      }
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
```

### 1.3 Use in tRPC routers

```ts
import { logger } from "../lib/logger";

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    logger.info({ userId: ctx.user.id }, "user.me called");
    return ctx.user;
  }),
});
```

### 1.4 Add a tRPC logging middleware — `packages/api/src/trpc.ts`

```ts
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  if (result.ok) {
    logger.info({ path, type, durationMs }, "tRPC OK");
  } else {
    logger.error({ path, type, durationMs, error: result.error }, "tRPC Error");
  }

  return result;
});

// Apply to all procedures
export const publicProcedure = t.procedure.use(loggerMiddleware);
```

### 1.5 Next.js Axiom integration — `apps/nextjs/next.config.ts`

```ts
import { withAxiom } from "@axiomhq/nextjs";

export default withAxiom(withBundleAnalyzer(nextConfig));
```

This automatically ships Next.js server logs and Web Vitals to Axiom.

### 1.6 Add to `apps/nextjs/.env.local` and `.env.example`

```bash
AXIOM_TOKEN=your-axiom-token
AXIOM_DATASET=your-dataset-name
```

### 1.7 Install pino-pretty for local dev

```bash
pnpm add -D pino-pretty --filter @my-app/api
```

In development, logs are pretty-printed to the terminal. In production, they ship to Axiom as structured JSON.

---

## 2. Security Headers — next-safe

One package that generates a strict Content Security Policy, HSTS, X-Frame-Options, and other security headers for Next.js. Without this, most security audits will flag your app immediately.

### 2.1 Install

```bash
pnpm add next-safe --filter @my-app/nextjs
```

### 2.2 `apps/nextjs/next.config.ts`

```ts
import nextSafe from "next-safe";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: nextSafe({
          isDev,
          contentSecurityPolicy: {
            "default-src": ["'self'"],
            "script-src": [
              "'self'",
              "'unsafe-inline'", // required for Next.js
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
    "@my-app/supabase",
    "@my-app/ui-web",
    "@my-app/validators",
  ],
};
```

> **Note:** CSP `connect-src` must include every external domain your app communicates with. Add Stripe, Trigger.dev, and any others as needed. In development, `isDev: true` relaxes the policy so hot reload works.

### 2.3 Verify headers in CI

Add this step to `.github/workflows/ci.yml`:

```yaml
- name: Check security headers
  run: |
    pnpm --filter @my-app/nextjs build
    pnpm --filter @my-app/nextjs start &
    sleep 5
    curl -s -I http://localhost:3000 | grep -E "x-frame-options|content-security-policy|strict-transport-security"
```

---

## 3. MMKV — Replace AsyncStorage in Expo

AsyncStorage is slow (async, JS-thread-only) and unencrypted. MMKV is ~30x faster, synchronous, and supports AES-256 encryption. Your Supabase session tokens are sensitive data — they should be encrypted at rest.

### 3.1 Install

```bash
pnpm expo install react-native-mmkv --filter @my-app/expo
```

### 3.2 Create MMKV storage adapter — `apps/expo/src/lib/storage.ts`

```ts
import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({
  id: "my-app-storage",
  encryptionKey: process.env.EXPO_PUBLIC_MMKV_ENCRYPTION_KEY!,
});

// Supabase-compatible storage adapter
export const mmkvStorageAdapter = {
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  getItem: (key: string) => {
    return storage.getString(key) ?? null;
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
};
```

### 3.3 Update `apps/expo/src/lib/supabase.ts`

Replace `AsyncStorage` with the MMKV adapter:

```ts
import { createClient } from "@supabase/supabase-js";
import { mmkvStorageAdapter } from "./storage";
import type { Database } from "@my-app/supabase/types";

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: mmkvStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### 3.4 Add encryption key to `apps/expo/.env.local` and `.env.example`

```bash
# Generate with: openssl rand -hex 32
EXPO_PUBLIC_MMKV_ENCRYPTION_KEY=your-32-byte-hex-key
```

### 3.5 MMKV for React Query persistence (offline support — see section 11)

MMKV also doubles as the persistence layer for React Query offline caching. This is wired up in section 11.

---

## 4. Lighthouse CI

Runs Google Lighthouse against your Next.js app on every PR. Fails the build if Core Web Vitals drop below thresholds. Catches performance regressions before they reach users.

### 4.1 Install

```bash
pnpm add -D @lhci/cli --filter @my-app/nextjs
```

### 4.2 `apps/nextjs/lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "startServerCommand": "pnpm start",
      "startServerReadyPattern": "ready on",
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.8 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.8 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 3000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 300 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### 4.3 Add to `.github/workflows/ci.yml`

```yaml
- name: Build Next.js for Lighthouse
  run: pnpm --filter @my-app/nextjs build
  env:
    NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder
    # ... other required env vars

- name: Run Lighthouse CI
  run: pnpm --filter @my-app/nextjs exec lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

> Install the [Lighthouse CI GitHub App](https://github.com/apps/lighthouse-ci) on your repo to get inline PR comments with Lighthouse scores.

---

## 5. Deep Linking — Universal Links + Expo Router

Required for password reset emails, OAuth callbacks, share links, and push notification taps. Much harder to add after launch.

### 5.1 `apps/expo/app.config.ts` — configure scheme and associated domains

```ts
export default {
  expo: {
    scheme: "myapp",
    ios: {
      bundleIdentifier: "com.yourcompany.myapp",
      associatedDomains: ["applinks:yourdomain.com"],
    },
    android: {
      package: "com.yourcompany.myapp",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "yourdomain.com",
              pathPrefix: "/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    updates: {
      url: "https://u.expo.dev/YOUR_PROJECT_ID",
    },
  },
};
```

### 5.2 Apple — `apps/nextjs/public/.well-known/apple-app-site-association`

This file must be served at `https://yourdomain.com/.well-known/apple-app-site-association` with `Content-Type: application/json`.

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOURTEAMID.com.yourcompany.myapp",
        "paths": [
          "/reset-password",
          "/invite/*",
          "/share/*"
        ]
      }
    ]
  }
}
```

### 5.3 Android — `apps/nextjs/public/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.yourcompany.myapp",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_CERT_FINGERPRINT"
      ]
    }
  }
]
```

Get your SHA256 fingerprint from EAS:
```bash
eas credentials --platform android
```

### 5.4 Serve well-known files with correct headers — `apps/nextjs/next.config.ts`

```ts
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
    // ... security headers from section 2
  ];
},
```

### 5.5 Handle deep links in Expo Router — `apps/expo/src/app/_layout.tsx`

Expo Router handles URL routing automatically based on your file structure. Add a handler for specific deep link paths:

```ts
import * as Linking from "expo-linking";
import { useEffect } from "react";
import { router } from "expo-router";

export default function RootLayout() {
  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const { path, queryParams } = Linking.parse(url);

      if (path === "reset-password" && queryParams?.token) {
        router.push({
          pathname: "/reset-password",
          params: { token: queryParams.token as string },
        });
      }
    });

    return () => subscription.remove();
  }, []);

  // ... rest of layout
}
```

### 5.6 Update Supabase auth redirect URLs

In your Supabase project dashboard → Auth → URL Configuration:

```
Site URL: https://yourdomain.com
Redirect URLs:
  https://yourdomain.com/**
  myapp://             ← native deep link scheme
  exp://localhost:8081 ← Expo Go in development
```

---

## 6. Supabase Realtime

Already in your stack but not wired up. Here are the standard patterns.

### 6.1 Realtime hook for Next.js — `apps/nextjs/src/hooks/use-realtime.ts`

```ts
"use client";
import { createBrowserClient } from "@my-app/supabase/client";
import { useEffect, useState } from "react";

export function useRealtimeTable<T>(
  table: string,
  initialData: T[],
  filter?: string
) {
  const [data, setData] = useState<T[]>(initialData);
  const supabase = createBrowserClient();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setData((prev) => [...prev, payload.new as T]);
          }
          if (payload.eventType === "UPDATE") {
            setData((prev) =>
              prev.map((item: any) =>
                item.id === (payload.new as any).id ? payload.new as T : item
              )
            );
          }
          if (payload.eventType === "DELETE") {
            setData((prev) =>
              prev.filter((item: any) => item.id !== (payload.old as any).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);

  return data;
}
```

### 6.2 Realtime hook for Expo — `apps/expo/src/hooks/use-realtime.ts`

```ts
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

export function useRealtimeTable<T>(
  table: string,
  initialData: T[],
  filter?: string
) {
  const [data, setData] = useState<T[]>(initialData);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setData((prev) => [...prev, payload.new as T]);
          }
          if (payload.eventType === "UPDATE") {
            setData((prev) =>
              prev.map((item: any) =>
                item.id === (payload.new as any).id ? payload.new as T : item
              )
            );
          }
          if (payload.eventType === "DELETE") {
            setData((prev) =>
              prev.filter((item: any) => item.id !== (payload.old as any).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);

  return data;
}
```

### 6.3 Enable Realtime on your Supabase tables

In Supabase Studio → Database → Replication, enable replication for each table you want to subscribe to. Or via SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE your_table_name;
```

### 6.4 Presence (online users)

```ts
const channel = supabase.channel("online-users");

channel
  .on("presence", { event: "sync" }, () => {
    const state = channel.presenceState();
    const onlineUsers = Object.values(state).flat();
    setOnlineUsers(onlineUsers);
  })
  .subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({ userId: user.id, onlineAt: new Date().toISOString() });
    }
  });
```

---

## 7. Project README

### `README.md` (root)

```markdown
# My App

A cross-platform app built with Expo (iOS/Android) and Next.js (web), sharing a unified backend via Supabase and tRPC.

## Stack

| Layer | Technology |
|---|---|
| Mobile | Expo SDK 54, React Native 0.81, Expo Router v4 |
| Web | Next.js 15, App Router |
| API | tRPC v11, React Query v5 |
| Auth + DB | Supabase (Auth, Postgres, Realtime, Storage) |
| ORM | Drizzle ORM |
| Styling | NativeWind v5 + Tailwind CSS v4 |
| Monorepo | Turborepo + pnpm workspaces |
| Hosting | Vercel (web), EAS (mobile) |

## Project structure

```
apps/
  expo/       # React Native mobile app
  nextjs/     # Next.js web app
packages/
  api/        # tRPC router + Drizzle schema
  supabase/   # Supabase client + generated types
  ui-native/  # Native UI components
  ui-web/     # Web UI components (shadcn/ui)
  validators/ # Shared Zod schemas
```

## Getting started

**Prerequisites:** Node.js 20+, pnpm 9+, Docker (for local Supabase)

```bash
git clone https://github.com/yourorg/my-app
cd my-app
pnpm setup
```

Then fill in the missing values in `apps/nextjs/.env.local` and `apps/expo/.env.local`.

## Running locally

```bash
pnpm dev                          # start all apps
pnpm --filter @my-app/nextjs dev  # web only
pnpm --filter @my-app/expo dev    # mobile only
```

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| Supabase Studio | http://localhost:54423 |
| Drizzle Studio | http://localhost:4983 |

## Common tasks

```bash
pnpm supabase:types        # regenerate types after schema change
pnpm --filter @my-app/api db:generate  # generate migration after schema edit
pnpm --filter @my-app/api db:migrate   # apply migrations locally
pnpm --filter @my-app/nextjs analyze   # analyze Next.js bundle
pnpm test                  # run all unit tests
pnpm lint                  # lint all packages
pnpm typecheck             # typecheck all packages
```

## Contributing

1. Create a branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Run `pnpm lint && pnpm typecheck && pnpm test`
4. If you changed `packages/*`, run `pnpm changeset`
5. If you changed the DB schema, run `pnpm --filter @my-app/api db:generate`
6. Open a PR — fill in the PR template

## Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Production. Protected, requires PR + passing CI. |
| `feat/*` | Feature branches. Branch from and PR back to `main`. |
| `fix/*` | Bug fixes. Same as above. |
| `chore/*` | Maintenance, deps, refactoring. |

## Deployment

- **Web:** Merging to `main` auto-deploys to Vercel.
- **Mobile OTA:** Merging to `main` publishes an EAS Update to the production channel.
- **Mobile store build:** Run `eas build --profile production --platform all` manually or via the release workflow.

## Environment variables

See `apps/nextjs/.env.example` and `apps/expo/.env.example` for all required variables.
```

---

## 8. GDPR & Privacy Compliance

Required if you have EU users. The minimum viable implementation.

### 8.1 Install

```bash
pnpm add cookies-next --filter @my-app/nextjs
```

### 8.2 Cookie consent — `apps/nextjs/src/components/cookie-banner.tsx`

```tsx
"use client";
import { useState, useEffect } from "react";
import { setCookie, getCookie } from "cookies-next";
import posthog from "posthog-js";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    setCookie("cookie-consent", "accepted", { maxAge: 60 * 60 * 24 * 365 });
    posthog.opt_in_capturing();
    setVisible(false);
  };

  const decline = () => {
    setCookie("cookie-consent", "declined", { maxAge: 60 * 60 * 24 * 365 });
    posthog.opt_out_capturing();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-gray-600">
        We use cookies for analytics to improve your experience.{" "}
        <a href="/privacy" className="underline">Privacy policy</a>
      </p>
      <div className="flex gap-2">
        <button
          onClick={decline}
          className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
        >
          Decline
        </button>
        <button
          onClick={accept}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
```

Add `<CookieBanner />` to your root layout.

### 8.3 PostHog — respect consent on init

Update `apps/nextjs/src/providers/posthog-provider.tsx`:

```ts
import { getCookie } from "cookies-next";

posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
  capture_pageview: false,
  opt_out_capturing_by_default: true, // start opted out
});

// Only opt in if user has already consented
const consent = getCookie("cookie-consent");
if (consent === "accepted") {
  posthog.opt_in_capturing();
}
```

### 8.4 Data deletion tRPC endpoint

```ts
// packages/api/src/routers/user.ts
export const userRouter = router({
  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const { user, supabase } = ctx;

    // 1. Delete user data from your tables
    await db.delete(users).where(eq(users.id, user.id));

    // 2. Delete from Supabase Auth (requires service role key)
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    logger.info({ userId: user.id }, "user.deleteAccount completed");
    return { success: true };
  }),
});
```

### 8.5 Required pages

Create these routes in Next.js:

- `apps/nextjs/src/app/privacy/page.tsx` — Privacy policy
- `apps/nextjs/src/app/terms/page.tsx` — Terms of service
- `apps/nextjs/src/app/account/delete/page.tsx` — Account deletion form (calls `user.deleteAccount`)

---

## 9. Fastlane — App Store Automation

Automates screenshots, metadata, and binary submissions. Only set up after your first manual submission so you understand the process.

### 9.1 Install Fastlane

```bash
# Fastlane is a Ruby tool — install globally
gem install fastlane

# Initialize in the expo app
cd apps/expo
fastlane init
```

### 9.2 `apps/expo/fastlane/Fastfile`

```ruby
default_platform(:ios)

platform :ios do
  desc "Submit a new build to TestFlight"
  lane :beta do
    # EAS handles the actual build — Fastlane handles submission metadata
    app_store_connect_api_key(
      key_id: ENV["APP_STORE_KEY_ID"],
      issuer_id: ENV["APP_STORE_ISSUER_ID"],
      key_content: ENV["APP_STORE_KEY_CONTENT"],
    )
    upload_to_testflight(
      ipa: "build/MyApp.ipa",
      skip_waiting_for_build_processing: true,
    )
  end

  desc "Take screenshots"
  lane :screenshots do
    capture_screenshots(workspace: "MyApp.xcworkspace", scheme: "MyApp")
    frame_screenshots(white: true)
    upload_to_app_store(skip_binary_upload: true, skip_metadata: true)
  end
end

platform :android do
  desc "Submit to Play Store internal track"
  lane :beta do
    upload_to_play_store(
      track: "internal",
      aab: "build/MyApp.aab",
      json_key_data: ENV["PLAY_STORE_JSON_KEY"],
    )
  end
end
```

### 9.3 `apps/expo/fastlane/Appfile`

```ruby
app_identifier("com.yourcompany.myapp")
apple_id("your@apple.id")
team_id("YOUR_TEAM_ID")
```

### 9.4 Add Fastlane to CI — `.github/workflows/eas-production.yml`

```yaml
name: Production Release

on:
  workflow_dispatch:   # manual trigger only

jobs:
  build-and-submit:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build production iOS
        run: eas build --profile production --platform ios --non-interactive --wait
        working-directory: apps/expo

      - name: Build production Android
        run: eas build --profile production --platform android --non-interactive --wait
        working-directory: apps/expo

      - name: Submit to stores via Fastlane
        run: |
          gem install fastlane
          cd apps/expo
          fastlane ios beta
          fastlane android beta
        env:
          APP_STORE_KEY_ID: ${{ secrets.APP_STORE_KEY_ID }}
          APP_STORE_ISSUER_ID: ${{ secrets.APP_STORE_ISSUER_ID }}
          APP_STORE_KEY_CONTENT: ${{ secrets.APP_STORE_KEY_CONTENT }}
          PLAY_STORE_JSON_KEY: ${{ secrets.PLAY_STORE_JSON_KEY }}
```

### 9.5 Add secrets to GitHub

| Secret | Source |
|---|---|
| `APP_STORE_KEY_ID` | App Store Connect → Keys |
| `APP_STORE_ISSUER_ID` | App Store Connect → Keys |
| `APP_STORE_KEY_CONTENT` | Downloaded `.p8` file, base64 encoded |
| `PLAY_STORE_JSON_KEY` | Google Play Console → Service Accounts |

---

## 10. Internationalization — i18next + expo-localization

Only scaffold this if you need multiple languages from day one. Add the structure even if you only have one language — retrofitting i18n is painful.

### 10.1 Install

```bash
pnpm add i18next react-i18next --filter @my-app/nextjs
pnpm add i18next react-i18next expo-localization --filter @my-app/expo
pnpm expo install expo-localization --filter @my-app/expo
```

### 10.2 Create a shared `packages/i18n` package

```bash
mkdir -p packages/i18n/src/locales
```

`packages/i18n/package.json`:

```json
{
  "name": "@my-app/i18n",
  "version": "0.1.0",
  "exports": {
    ".": "./src/index.ts",
    "./locales/*": "./src/locales/*"
  },
  "dependencies": {
    "i18next": "^23.0.0"
  }
}
```

### 10.3 `packages/i18n/src/locales/en.ts`

```ts
export default {
  common: {
    loading: "Loading...",
    error: "Something went wrong",
    retry: "Try again",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
  },
  auth: {
    signIn: "Sign in",
    signOut: "Sign out",
    signUp: "Create account",
    email: "Email address",
    password: "Password",
    forgotPassword: "Forgot password?",
  },
  errors: {
    required: "This field is required",
    invalidEmail: "Please enter a valid email",
    unauthorized: "You must be signed in to do that",
  },
} as const;
```

`packages/i18n/src/locales/fr.ts`:

```ts
export default {
  common: {
    loading: "Chargement...",
    error: "Une erreur est survenue",
    retry: "Réessayer",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
  },
  auth: {
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    signUp: "Créer un compte",
    email: "Adresse e-mail",
    password: "Mot de passe",
    forgotPassword: "Mot de passe oublié ?",
  },
  errors: {
    required: "Ce champ est obligatoire",
    invalidEmail: "Veuillez entrer une adresse e-mail valide",
    unauthorized: "Vous devez être connecté pour faire cela",
  },
} as const;
```

### 10.4 `packages/i18n/src/index.ts`

```ts
import i18next from "i18next";
import en from "./locales/en";
import fr from "./locales/fr";

export const defaultNS = "translation";

export const resources = { en: { translation: en }, fr: { translation: fr } };

export type TranslationKeys = typeof en;

export { i18next };
```

### 10.5 Next.js setup — `apps/nextjs/src/lib/i18n.ts`

```ts
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, defaultNS } from "@my-app/i18n";

i18next.use(initReactI18next).init({
  resources,
  defaultNS,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18next;
```

### 10.6 Expo setup — `apps/expo/src/lib/i18n.ts`

```ts
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import { resources, defaultNS } from "@my-app/i18n";

const deviceLanguage = getLocales()[0]?.languageCode ?? "en";

i18next.use(initReactI18next).init({
  resources,
  defaultNS,
  lng: deviceLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18next;
```

### 10.7 Usage in both apps

```tsx
import { useTranslation } from "react-i18next";

export function SignInButton() {
  const { t } = useTranslation();
  return <button>{t("auth.signIn")}</button>;
}
```

---

## 11. Offline Support — React Query Persistence + MMKV

Allows your app to show cached data when there is no network connection, and replay mutations when connectivity is restored.

### 11.1 Install

```bash
pnpm add @tanstack/query-persist-client-core @tanstack/react-query-persist-client --filter @my-app/expo
```

### 11.2 MMKV persister — `apps/expo/src/lib/query-persister.ts`

```ts
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { storage } from "./storage"; // your MMKV instance from section 3

const mmkvClientStorage = {
  setItem: (key: string, value: string) => storage.set(key, value),
  getItem: (key: string) => storage.getString(key) ?? null,
  removeItem: (key: string) => storage.delete(key),
};

export const persister = createSyncStoragePersister({
  storage: mmkvClientStorage,
  key: "react-query-cache",
  throttleTime: 1000,
});
```

### 11.3 Update tRPC provider — `apps/expo/src/providers/trpc-provider.tsx`

```tsx
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { persister } from "../lib/query-persister";
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours — keep cache for offline use
      staleTime: 1000 * 60 * 5,    // 5 minutes — consider data stale after 5 min
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
  },
});

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/trpc`,
          async headers() {
            const { data: { session } } = await supabase.auth.getSession();
            return {
              Authorization: session ? `Bearer ${session.access_token}` : "",
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        {children}
      </PersistQueryClientProvider>
    </trpc.Provider>
  );
}
```

### 11.4 Optimistic mutations with offline replay

```ts
const utils = trpc.useUtils();

const updateProfile = trpc.user.update.useMutation({
  // Optimistically update the UI immediately
  onMutate: async (newData) => {
    await utils.user.me.cancel();
    const previous = utils.user.me.getData();
    utils.user.me.setData(undefined, (old) => ({ ...old!, ...newData }));
    return { previous };
  },
  // Roll back if the mutation fails
  onError: (err, newData, context) => {
    utils.user.me.setData(undefined, context?.previous);
  },
  // Always refetch after settle
  onSettled: () => {
    utils.user.me.invalidate();
  },
});
```

### 11.5 Network status indicator — `apps/expo/src/components/offline-banner.tsx`

```tsx
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return unsubscribe;
  }, []);

  if (!isOffline) return null;

  return (
    <View className="bg-yellow-500 px-4 py-2">
      <Text className="text-white text-center text-sm font-medium">
        You are offline. Showing cached data.
      </Text>
    </View>
  );
}
```

Install the NetInfo package:
```bash
pnpm expo install @react-native-community/netinfo --filter @my-app/expo
```

---

## 12. Complete GitHub Secrets Reference

A full list of every secret needed across all four documents:

| Secret | Used by | Where to get it |
|---|---|---|
| `EXPO_TOKEN` | EAS Build, EAS Update | expo.dev → Access Tokens |
| `SENTRY_AUTH_TOKEN` | Sentry source maps | sentry.io → Settings → Auth Tokens |
| `LHCI_GITHUB_APP_TOKEN` | Lighthouse CI | GitHub App installation |
| `APP_STORE_KEY_ID` | Fastlane iOS | App Store Connect → Keys |
| `APP_STORE_ISSUER_ID` | Fastlane iOS | App Store Connect → Keys |
| `APP_STORE_KEY_CONTENT` | Fastlane iOS | `.p8` file, base64 encoded |
| `PLAY_STORE_JSON_KEY` | Fastlane Android | Google Play → Service Accounts |

---

## 13. Key Rules for the Agent

- **MMKV requires a new Expo build** — it contains native code. After installing `react-native-mmkv`, you cannot use Expo Go. You must run `eas build --profile development` to get a development client.
- **The well-known files must be served with `Content-Type: application/json`** — without the explicit header config in `next.config.ts`, Next.js serves them as `text/plain` and Apple's verification will fail silently.
- **Universal links require a production domain** — they cannot be tested on localhost. Use `myapp://` (the custom scheme) during development and deep link testing.
- **PostHog must start opted out** — set `opt_out_capturing_by_default: true` and only opt in after confirmed cookie consent. Capturing before consent is a GDPR violation.
- **The data deletion endpoint requires the Supabase service role key** — `supabase.auth.admin.deleteUser()` will not work with the anon key. The service role key must only ever be used server-side.
- **React Query `gcTime` must be longer than `staleTime`** for offline persistence to work. `gcTime` controls how long data stays in cache; `staleTime` controls when it is considered outdated.
- **Fastlane is a manual/release-only workflow** — do not run it on every PR or push to main. The `workflow_dispatch` trigger in the CI file makes it manual only.
- **Add `@my-app/i18n` as a dependency** in both `apps/expo/package.json` and `apps/nextjs/package.json` after creating the package.
- **Lighthouse CI scores are thresholds, not targets** — adjust the values in `lighthouserc.json` to match your app's realistic baseline before enforcing them in CI, otherwise the first run will always fail.
- **Run `pnpm supabase:types` after enabling Realtime** — enabling replication on a table can surface new fields in the generated types.
