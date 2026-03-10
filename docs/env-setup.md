# Environment Variables Setup Guide

This guide tells you where to get each environment variable value. Copy `.env.example` to `.env.local` in each app and fill in the values.

## Quick Start (Local Development)

Most variables are auto-populated when you run `pnpm supabase:start`. The setup script handles this for you:

```bash
pnpm setup
```

---

## Web App (`apps/nextjs/.env.local`)

### Supabase (required)

| Variable                       | Where to get it                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`     | **Local:** printed by `supabase start`. **Prod:** [Supabase Dashboard](https://supabase.com/dashboard) → Project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Same as above — the `anon` / `public` key                                                 |
| `SUPABASE_SERVICE_ROLE_KEY`    | Same location — the `service_role` key (keep secret!)                                      |

### Database (required)

| Variable              | Where to get it                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | [Supabase Dashboard](https://supabase.com/dashboard) → Project → Settings → Database → Connection string (Session mode / Pooler). **Local:** `postgresql://postgres:postgres@localhost:54422/postgres` |
| `DATABASE_DIRECT_URL` | Same page → Direct connection string. Used for migrations only. **Local:** same as `DATABASE_URL`      |

### Sentry (required)

| Variable                   | Where to get it                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`   | [Sentry Dashboard](https://sentry.io) → Project → Settings → Client Keys (DSN)          |
| `SENTRY_AUTH_TOKEN`        | [Sentry Auth Tokens](https://sentry.io/settings/auth-tokens/) → Create new token         |

### PostHog (required)

| Variable                    | Where to get it                                                              |
| --------------------------- | ---------------------------------------------------------------------------- |
| `NEXT_PUBLIC_POSTHOG_KEY`   | [PostHog](https://app.posthog.com) → Project → Settings → Project API Key   |
| `NEXT_PUBLIC_POSTHOG_HOST`  | Usually `https://app.posthog.com` (or your self-hosted URL)                  |

### Resend (required)

| Variable        | Where to get it                                                  |
| --------------- | ---------------------------------------------------------------- |
| `RESEND_API_KEY` | [Resend Dashboard](https://resend.com/api-keys) → Create API Key |

### Trigger.dev (required)

| Variable            | Where to get it                                                                |
| ------------------- | ------------------------------------------------------------------------------ |
| `TRIGGER_SECRET_KEY` | [Trigger.dev Dashboard](https://cloud.trigger.dev) → Project → Settings → API |

### Upstash Redis (required)

| Variable                   | Where to get it                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | [Upstash Console](https://console.upstash.com) → Redis Database → REST API → URL       |
| `UPSTASH_REDIS_REST_TOKEN` | Same page → REST API → Token                                                            |

### Stripe (required)

| Variable                              | Where to get it                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`                   | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Secret key                   |
| `STRIPE_WEBHOOK_SECRET`               | [Stripe Webhooks](https://dashboard.stripe.com/webhooks) → Endpoint → Signing secret     |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Publishable key               |

### Axiom (optional — logging)

| Variable        | Where to get it                                                                     |
| --------------- | ----------------------------------------------------------------------------------- |
| `AXIOM_TOKEN`   | [Axiom Dashboard](https://app.axiom.co/settings/api-tokens) → Create API Token      |
| `AXIOM_DATASET` | [Axiom Datasets](https://app.axiom.co/datasets) → Your dataset name                 |

### Sanity (optional — CMS)

| Variable                        | Where to get it                                                      |
| ------------------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | [Sanity Manage](https://www.sanity.io/manage) → Project → Project ID |
| `NEXT_PUBLIC_SANITY_DATASET`    | Usually `production`                                                  |

---

## Mobile App (`apps/expo/.env.local`)

| Variable                            | Where to get it                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`          | Same as `NEXT_PUBLIC_SUPABASE_URL` above                                        |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`     | Same as `NEXT_PUBLIC_SUPABASE_ANON_KEY` above                                   |
| `EXPO_PUBLIC_API_URL`               | **Local:** `http://localhost:3000`. **Prod:** your deployed API URL              |
| `EXPO_PUBLIC_SENTRY_DSN`           | [Sentry](https://sentry.io) → React Native project DSN                          |
| `EXPO_PUBLIC_POSTHOG_KEY`           | Same as `NEXT_PUBLIC_POSTHOG_KEY` above                                         |
| `EXPO_PUBLIC_REVENUECAT_APPLE_KEY`  | [RevenueCat](https://app.revenuecat.com) → Project → API Keys → Apple           |
| `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY` | Same page → Google key                                                           |
| `EXPO_PUBLIC_MMKV_ENCRYPTION_KEY`   | Generate a random string: `openssl rand -hex 32`                                 |

---

## GitHub Actions Secrets

These must be set in your repo's **Settings → Secrets and variables → Actions**:

| Secret               | Source                                              |
| -------------------- | --------------------------------------------------- |
| `CHECKLY_API_KEY`    | [Checkly](https://app.checklyhq.com) → Account Settings → API Keys |
| `CHECKLY_ACCOUNT_ID` | Same page → Account ID                              |
| `SENTRY_AUTH_TOKEN`  | Same as above                                        |
| `EXPO_TOKEN`         | [Expo](https://expo.dev/accounts/settings/access-tokens) → Access Tokens |

---

## Tips

- **Local Supabase** auto-provides `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, and `DATABASE_URL` — printed when you run `supabase start`
- **Stripe test mode** keys start with `sk_test_` and `pk_test_` — use these for local dev
- **Sentry** can be set to a dummy DSN locally if you don't need error tracking in dev
- Run `pnpm setup` to automate most of this
