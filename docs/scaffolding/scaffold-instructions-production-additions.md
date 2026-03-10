# Production Additions — Scaffold Instructions
> This document is a companion to `scaffold-instructions.md`. Apply these additions after the base monorepo is scaffolded. Follow each section in order.

---

## 1. Type-safe Environment Variables — t3-env

Install in each app and in `packages/api`:

```bash
pnpm add @t3-oss/env-nextjs zod --filter @my-app/nextjs
pnpm add @t3-oss/env-core zod --filter @my-app/expo
pnpm add @t3-oss/env-core zod --filter @my-app/api
```

### `apps/nextjs/src/env.ts`

```ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    TRIGGER_SECRET_KEY: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    SENTRY_AUTH_TOKEN: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
});
```

### `apps/expo/src/env.ts`

```ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    EXPO_PUBLIC_API_URL: z.string().url(),
    EXPO_PUBLIC_POSTHOG_KEY: z.string().min(1),
    EXPO_PUBLIC_SENTRY_DSN: z.string().url(),
  },
  runtimeEnv: {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  },
});
```

> **Rule:** Import from `~/env` everywhere instead of using `process.env` directly. The build will fail fast if a required variable is missing.

---

## 2. Error Monitoring — Sentry

### 2.1 Next.js

```bash
pnpm add @sentry/nextjs --filter @my-app/nextjs
```

Run the Sentry wizard — it auto-configures `instrumentation.ts` and `next.config.ts`:

```bash
pnpm dlx @sentry/wizard@latest -i nextjs --filter @my-app/nextjs
```

### `apps/nextjs/sentry.client.config.ts`

```ts
import * as Sentry from "@sentry/nextjs";
import { env } from "./src/env";

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [Sentry.replayIntegration()],
});
```

### `apps/nextjs/sentry.server.config.ts`

```ts
import * as Sentry from "@sentry/nextjs";
import { env } from "./src/env";

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
});
```

### 2.2 Expo

```bash
pnpm add @sentry/react-native --filter @my-app/expo
pnpm expo install @sentry/react-native --filter @my-app/expo
```

### `apps/expo/src/lib/sentry.ts`

```ts
import * as Sentry from "@sentry/react-native";
import { env } from "../env";

export function initSentry() {
  Sentry.init({
    dsn: env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    enableNativeFramesTracking: true,
  });
}
```

Call `initSentry()` at the top of `apps/expo/src/app/_layout.tsx` before anything else renders.

Wrap the root layout with `Sentry.wrap`:

```ts
export default Sentry.wrap(RootLayout);
```

---

## 3. Rate Limiting — Upstash Redis

```bash
pnpm add @upstash/redis @upstash/ratelimit --filter @my-app/api
```

### `packages/api/src/lib/ratelimit.ts`

```ts
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
  analytics: true,
});
```

### Add rate limiting to tRPC middleware — `packages/api/src/trpc.ts`

```ts
import { ratelimit } from "./lib/ratelimit";
import { TRPCError } from "@trpc/server";

// Add this middleware to any procedure that needs rate limiting
export const rateLimitedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const identifier = ctx.user?.id ?? "anonymous";
  const { success } = await ratelimit.limit(identifier);
  if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  return next();
});
```

---

## 4. Email — Resend + React Email

```bash
pnpm add resend --filter @my-app/api
pnpm add react-email @react-email/components --filter @my-app/api
```

### `packages/api/src/lib/email.ts`

```ts
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
```

### `packages/api/src/emails/welcome.tsx`

```tsx
import {
  Body, Button, Container, Head, Heading,
  Html, Preview, Text,
} from "@react-email/components";

type Props = {
  name: string;
  loginUrl: string;
};

export function WelcomeEmail({ name, loginUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the app, {name}</Preview>
      <Body style={{ fontFamily: "sans-serif" }}>
        <Container>
          <Heading>Welcome, {name}!</Heading>
          <Text>Thanks for signing up. Click below to get started.</Text>
          <Button href={loginUrl}>Get started</Button>
        </Container>
      </Body>
    </Html>
  );
}
```

### Sending from a tRPC router

```ts
import { resend } from "../lib/email";
import { WelcomeEmail } from "../emails/welcome";

await resend.emails.send({
  from: "hello@yourdomain.com",
  to: user.email,
  subject: "Welcome!",
  react: WelcomeEmail({ name: user.name, loginUrl: "https://yourdomain.com" }),
});
```

Preview emails locally:

```bash
pnpm email dev --dir packages/api/src/emails
```

---

## 5. Background Jobs — Trigger.dev

```bash
pnpm add @trigger.dev/sdk --filter @my-app/api
pnpm add @trigger.dev/nextjs --filter @my-app/nextjs
```

### `packages/api/src/trigger/send-welcome-email.ts`

```ts
import { task } from "@trigger.dev/sdk/v3";
import { resend } from "../lib/email";
import { WelcomeEmail } from "../emails/welcome";

export const sendWelcomeEmailTask = task({
  id: "send-welcome-email",
  run: async (payload: { userId: string; email: string; name: string }) => {
    await resend.emails.send({
      from: "hello@yourdomain.com",
      to: payload.email,
      subject: "Welcome!",
      react: WelcomeEmail({
        name: payload.name,
        loginUrl: "https://yourdomain.com",
      }),
    });
    return { success: true };
  },
});
```

### Trigger from a tRPC router

```ts
import { sendWelcomeEmailTask } from "../trigger/send-welcome-email";

// Fire and forget — does not block the tRPC response
await sendWelcomeEmailTask.trigger({
  userId: user.id,
  email: user.email,
  name: user.name,
});
```

### `apps/nextjs/src/app/api/trigger/route.ts`

```ts
import { createNextRouteHandler } from "@trigger.dev/nextjs";
import { sendWelcomeEmailTask } from "@my-app/api/trigger/send-welcome-email";

export const { POST } = createNextRouteHandler({
  tasks: [sendWelcomeEmailTask],
});
```

Add to `apps/nextjs/.env.local`:

```
TRIGGER_SECRET_KEY=your-trigger-secret-key
```

---

## 6. Analytics + Feature Flags — PostHog

### 6.1 Next.js

```bash
pnpm add posthog-js posthog-node --filter @my-app/nextjs
```

### `apps/nextjs/src/lib/posthog.ts` (server)

```ts
import PostHog from "posthog-node";
import { env } from "../env";

export const posthog = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
  host: env.NEXT_PUBLIC_POSTHOG_HOST,
  flushAt: 1,
  flushInterval: 0,
});
```

### `apps/nextjs/src/providers/posthog-provider.tsx` (client)

```tsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import { env } from "../../env";

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false, // handled manually with App Router
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

Wrap your root layout with `<PHProvider>`.

### 6.2 Expo

```bash
pnpm add posthog-react-native --filter @my-app/expo
```

### `apps/expo/src/providers/posthog-provider.tsx`

```tsx
import { PostHogProvider } from "posthog-react-native";
import { env } from "../env";

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider
      apiKey={env.EXPO_PUBLIC_POSTHOG_KEY}
      options={{ host: "https://app.posthog.com" }}
    >
      {children}
    </PostHogProvider>
  );
}
```

### Feature flag usage (both platforms)

```ts
const { isFeatureEnabled } = useFeatureFlag("new-dashboard");
if (isFeatureEnabled) { ... }
```

---

## 7. Payments

### 7.1 Web — Stripe

```bash
pnpm add stripe @stripe/stripe-js --filter @my-app/nextjs
```

### `apps/nextjs/src/lib/stripe.ts`

```ts
import Stripe from "stripe";
import { env } from "../env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-10-28.acacia",
});
```

### Stripe webhook — `apps/nextjs/src/app/api/webhooks/stripe/route.ts`

```ts
import { stripe } from "@/lib/stripe";
import { env } from "@/env";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      // Handle successful payment
      break;
    case "customer.subscription.deleted":
      // Handle cancellation
      break;
  }

  return new Response(null, { status: 200 });
}
```

### 7.2 Native — RevenueCat

```bash
pnpm add react-native-purchases --filter @my-app/expo
pnpm expo install react-native-purchases --filter @my-app/expo
```

### `apps/expo/src/lib/purchases.ts`

```ts
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Platform } from "react-native";

const REVENUECAT_APPLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY!;
const REVENUECAT_GOOGLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY!;

export function initPurchases(userId?: string) {
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

  if (Platform.OS === "ios") {
    Purchases.configure({ apiKey: REVENUECAT_APPLE_KEY, appUserID: userId });
  } else if (Platform.OS === "android") {
    Purchases.configure({ apiKey: REVENUECAT_GOOGLE_KEY, appUserID: userId });
  }
}

export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}
```

Call `initPurchases(user.id)` after the user logs in.

Add to `apps/expo/.env.local`:

```
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=your-apple-key
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=your-google-key
```

---

## 8. Push Notifications — Expo Notifications + EAS

```bash
pnpm expo install expo-notifications expo-device --filter @my-app/expo
```

### `apps/expo/src/lib/notifications.ts`

```ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}
```

### Store the token via tRPC after login

```ts
const utils = trpc.useUtils();
const savePushToken = trpc.user.savePushToken.useMutation();

useEffect(() => {
  registerForPushNotifications().then((token) => {
    if (token) savePushToken.mutate({ token });
  });
}, []);
```

Add a `push_tokens` table to your Drizzle schema to persist tokens per user.

### Sending a push notification from the server (tRPC / Trigger.dev)

```ts
import { Expo } from "expo-server-sdk";

const expo = new Expo();

export async function sendPushNotification(token: string, message: string) {
  if (!Expo.isExpoPushToken(token)) return;

  await expo.sendPushNotificationsAsync([{
    to: token,
    title: "Notification",
    body: message,
    sound: "default",
  }]);
}
```

```bash
pnpm add expo-server-sdk --filter @my-app/api
```

---

## 9. OTA Updates — EAS Update

### 9.1 Configure EAS

```bash
pnpm add -g eas-cli
eas update:configure --filter @my-app/expo
```

### `apps/expo/eas.json`

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  },
  "update": {
    "channel": "production"
  }
}
```

### `apps/expo/app.config.ts` — enable updates

```ts
export default {
  expo: {
    updates: {
      url: "https://u.expo.dev/YOUR_PROJECT_ID",
      enabled: true,
      fallbackToCacheTimeout: 0,
      checkAutomatically: "ON_LOAD",
    },
    runtimeVersion: { policy: "appVersion" },
  },
};
```

---

## 10. Testing

### 10.1 Vitest — unit tests

```bash
pnpm add -D vitest @vitejs/plugin-react --filter @my-app/api
pnpm add -D vitest @vitejs/plugin-react --filter @my-app/nextjs
```

### `packages/api/vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
});
```

### Example test — `packages/api/src/routers/user.test.ts`

```ts
import { describe, it, expect, vi } from "vitest";
import { createUserSchema } from "@my-app/validators";

describe("createUserSchema", () => {
  it("validates a correct user", () => {
    const result = createUserSchema.safeParse({
      email: "test@example.com",
      name: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = createUserSchema.safeParse({
      email: "not-an-email",
      name: "Test User",
    });
    expect(result.success).toBe(false);
  });
});
```

### 10.2 Playwright — Next.js E2E

```bash
pnpm add -D @playwright/test --filter @my-app/nextjs
pnpm playwright install
```

### `apps/nextjs/playwright.config.ts`

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### `apps/nextjs/e2e/auth.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
```

### 10.3 Maestro — Expo E2E

Install the Maestro CLI globally (not via pnpm):

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

### `apps/expo/.maestro/login.yaml`

```yaml
appId: com.yourcompany.yourapp
---
- launchApp
- assertVisible: "Sign in"
- tapOn: "Email"
- inputText: "test@example.com"
- tapOn: "Password"
- inputText: "testpassword"
- tapOn: "Sign in"
- assertVisible: "Welcome"
```

Run:

```bash
maestro test apps/expo/.maestro/login.yaml
```

---

## 11. CI/CD — GitHub Actions

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
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

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Test
        run: pnpm vitest run

      - name: Build
        run: pnpm build
        env:
          # Provide dummy env values so t3-env doesn't fail at build time in CI
          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder
          NEXT_PUBLIC_POSTHOG_KEY: placeholder
          NEXT_PUBLIC_POSTHOG_HOST: https://app.posthog.com
          NEXT_PUBLIC_SENTRY_DSN: https://placeholder@sentry.io/1
          DATABASE_URL: postgresql://placeholder
          SUPABASE_SERVICE_ROLE_KEY: placeholder
          RESEND_API_KEY: placeholder
          TRIGGER_SECRET_KEY: placeholder
          UPSTASH_REDIS_REST_URL: https://placeholder.upstash.io
          UPSTASH_REDIS_REST_TOKEN: placeholder
          STRIPE_SECRET_KEY: sk_test_placeholder
          STRIPE_WEBHOOK_SECRET: whsec_placeholder
          SENTRY_AUTH_TOKEN: placeholder
```

### `.github/workflows/eas-preview.yml`

Builds a preview Expo app on every PR:

```yaml
name: EAS Preview Build

on:
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
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

      - name: Build preview
        run: eas build --profile preview --platform all --non-interactive
        working-directory: apps/expo
```

### `.github/workflows/eas-update.yml`

Publishes an OTA update on every push to main:

```yaml
name: EAS Update

on:
  push:
    branches: [main]

jobs:
  update:
    runs-on: ubuntu-latest
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

      - name: Publish OTA update
        run: eas update --branch production --message "Deploy from CI"
        working-directory: apps/expo
```

---

## 12. Complete `.env.local` Reference

### `apps/nextjs/.env.local`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Supabase Postgres via Drizzle)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Resend
RESEND_API_KEY=re_xxx

# Trigger.dev
TRIGGER_SECRET_KEY=tr_dev_xxx

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### `apps/expo/.env.local`

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API (Next.js server)
EXPO_PUBLIC_API_URL=http://localhost:3000

# Sentry
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# PostHog
EXPO_PUBLIC_POSTHOG_KEY=phc_xxx

# RevenueCat
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=appl_xxx
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_xxx
```

---

## 13. GitHub Secrets to Configure

Go to your repo → Settings → Secrets → Actions and add:

| Secret | Used by |
|---|---|
| `EXPO_TOKEN` | EAS Build + EAS Update workflows |
| `SENTRY_AUTH_TOKEN` | Sentry source map uploads |
| `VERCEL_TOKEN` | Vercel deployment (if not using Vercel GitHub integration) |

---

## 14. Key Rules for the Agent

- **t3-env must be imported before any other env access.** Import `~/env` at the top of any file that reads `process.env`.
- **Sentry must be initialized before any other code runs.** In Expo, `initSentry()` goes at the very top of `_layout.tsx`. In Next.js, `instrumentation.ts` handles this automatically.
- **RevenueCat is native only.** Do not import `react-native-purchases` in any Next.js code.
- **Stripe is web only.** Do not use the Stripe server SDK in Expo. If you need to trigger a payment from Expo, call a tRPC mutation that runs the Stripe logic server-side.
- **All background jobs go through Trigger.dev.** Never run long-running async operations directly inside a tRPC mutation.
- **Rate limiting should wrap all public-facing tRPC procedures** using `rateLimitedProcedure`, not just auth routes.
- **PostHog feature flags are the only way to gate features.** Do not use ad-hoc env variables or hardcoded booleans for feature gating.
- **CI dummy env values** are needed because t3-env validates at build time. The CI workflow already includes these — do not remove them.
