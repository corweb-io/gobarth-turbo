# Full Project Stack Recap

A complete reference of everything defined across all six scaffold documents.

---

## Repository Structure

```
my-app/
├── apps/
│   ├── expo/              # React Native mobile app
│   ├── nextjs/            # Next.js web app
│   └── studio/            # Sanity CMS (optional)
├── packages/
│   ├── api/               # tRPC router + Drizzle ORM
│   ├── design-tokens/     # Colors, spacing, typography, radii, shadows, animation
│   ├── i18n/              # Shared translations
│   ├── supabase/          # Supabase client (browser + server) + generated types
│   ├── tailwind-config/   # Shared Tailwind theme
│   ├── ui-native/         # React Native UI components
│   ├── ui-web/            # Web UI components
│   └── validators/        # Shared Zod schemas
├── supabase/
│   ├── migrations/        # SQL migration files (source of truth)
│   └── seed.sql           # Local development seed data
├── .github/
│   ├── workflows/         # CI/CD pipelines
│   └── pull_request_template.md
├── .husky/                # Git hooks
├── .vscode/               # Editor config
└── scripts/
    └── setup.sh           # One-command developer onboarding
```

---

## Monorepo Tooling

| Tool | Purpose |
|---|---|
| Turborepo | Task orchestration, build caching, parallelism |
| pnpm workspaces | Package management, workspace linking |
| TypeScript 5 | Language, strict mode throughout |
| Biome | Linting + formatting (replaces ESLint + Prettier) |
| Husky | Git hooks |
| lint-staged | Run Biome only on staged files |
| commitlint | Enforce conventional commit messages |
| Renovate | Automated dependency update PRs |
| Changesets | Package versioning and changelogs |

---

## Apps

### `apps/expo` — Mobile

| Concern | Choice |
|---|---|
| SDK | Expo SDK 54 |
| Framework | React Native 0.81, React 19 |
| Navigation | Expo Router v4 |
| Styling | NativeWind v5 + Tailwind CSS v4 |
| Storage | MMKV (encrypted, replaces AsyncStorage) |
| Auth | Supabase Auth via `@supabase/supabase-js` + MMKV session persistence |
| Apple Sign-In | `expo-apple-authentication` (native, required for App Store) |
| OAuth | `expo-web-browser` for Google / GitHub |
| API calls | tRPC v11 client + React Query v5 |
| Push notifications | `expo-notifications` + Expo Push Service |
| File uploads | `expo-image-picker` + `expo-file-system` → Supabase Storage |
| Deep linking | Expo Router + Universal Links + custom scheme `myapp://` |
| Error monitoring | Sentry (`@sentry/react-native`) |
| Analytics | PostHog (`posthog-react-native`) |
| In-app purchases | RevenueCat (`react-native-purchases`) |
| Offline support | React Query persistence → MMKV |
| Network status | `@react-native-community/netinfo` |
| OTA updates | EAS Update (production channel) |
| Env validation | t3-env |
| Internationalisation | i18next + `expo-localization` |
| Builds | EAS Build |
| Store submission | EAS Submit + Fastlane |

### `apps/nextjs` — Web

| Concern | Choice |
|---|---|
| Framework | Next.js 15, React 19, App Router |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui via `packages/ui-web` |
| Auth | Supabase Auth via `@supabase/ssr` (cookie-based sessions) |
| OAuth callback | `/auth/callback` route handler |
| API | tRPC v11 route handler at `/api/trpc` |
| Database | Drizzle ORM → Supabase Postgres (pooler connection) |
| Error monitoring | Sentry (`@sentry/nextjs`) |
| Analytics | PostHog (`posthog-js` + `posthog-node`) |
| Logging | Pino → Axiom |
| Security headers | next-safe (CSP, HSTS, X-Frame-Options) |
| Payments | Stripe (checkout + webhooks) |
| Email | Resend + React Email templates |
| Bundle analysis | `@next/bundle-analyzer` |
| Performance | Lighthouse CI (Core Web Vitals gating on PRs) |
| Cookie consent | Custom banner + PostHog opt-in/out |
| Env validation | t3-env |
| Internationalisation | i18next |
| CMS (optional) | Sanity (ISR, GROQ queries) |
| Deployment | Vercel |

### `apps/studio` (optional)

Sanity Studio for CMS content management. Deployed to `your-project.sanity.studio`.

---

## Packages

### `packages/api`

The tRPC v11 router. Server-only. Never imported at runtime by Expo (dev dependency only — provides types).

- **tRPC context** — injects Supabase server client + authenticated user. Handles both cookie-based sessions (Next.js) and JWT bearer tokens (Expo).
- **Procedures** — `publicProcedure`, `protectedProcedure`, `rateLimitedProcedure`
- **Logging middleware** — every tRPC call logs path, type, duration, and errors via Pino
- **Rate limiting middleware** — Upstash Redis sliding window, keyed by user ID
- **Drizzle ORM** — connects to Supabase Postgres via pooler URL (`prepare: false` for PgBouncer compatibility)
- **Drizzle migrations** — `db:generate` creates SQL files, `db:migrate` applies them. Direct URL used for migrations only.
- **Background jobs** — Trigger.dev tasks defined here, triggered from routers
- **Email** — Resend client + React Email templates
- **Full-text search** — Postgres `tsvector` + `plainto_tsquery` via Drizzle
- **Push notifications** — `expo-server-sdk` for sending via Expo Push Service
- **Routers** — `user`, `search` (extend as needed)

### `packages/supabase`

| Export | Used by |
|---|---|
| `createBrowserClient()` | Next.js client components, Expo |
| `createSupabaseServerClient(cookies)` | Next.js server components, route handlers, tRPC context |
| `Database` type | All packages via `supabase gen types` |

### `packages/validators`

Shared Zod v3 schemas. Imported by both apps and `packages/api`. No platform-specific code.

### `packages/design-tokens`

Pure TypeScript constants. Zero runtime dependencies.

| Export | Contents |
|---|---|
| `colors` | Brand palette, gray scale, semantic colors |
| `spacing` / `space` | 4px base unit scale |
| `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing` | Typography scale |
| `radii` | Border radius scale |
| `shadowsWeb` | CSS box-shadow strings |
| `shadowsNative` | React Native shadow style objects |
| `duration`, `easing`, `easingNative` | Animation tokens |
| `component-types` | Shared prop type definitions (ButtonProps, InputProps, etc.) |
| `utils` | `getInitials`, `formatBadgeCount`, `getStatusColor`, `clamp` |

### `packages/tailwind-config`

Shared Tailwind theme consumed by both apps as a preset. Omits `content` (app-specific). Extends design-tokens into Tailwind classes so `bg-brand-500` means the same thing everywhere.

### `packages/ui-native`

React Native components. NativeWind for styling. Only imported by `apps/expo`.

Components: `Button`, `Input`, `Badge`, `Avatar`, `Card`, `Divider`

All component prop interfaces imported from `@my-app/design-tokens/component-types` — identical API to `ui-web`.

Shadow applied via `style` prop (not className) using `shadowsNative` tokens.

### `packages/ui-web`

Web components. Tailwind + CVA + shadcn/ui. Only imported by `apps/nextjs`.

Components: `Button`, `Input`, `Badge`, `Avatar`, `Card`, `Divider`, `cn` utility

All component prop interfaces imported from `@my-app/design-tokens/component-types` — identical API to `ui-native`.

### `packages/i18n`

Shared translation files. Consumed by both apps via i18next.

Locales: `en`, `fr` (extend as needed)

Namespaces: `common`, `auth`, `errors`

---

## Backend — Supabase

| Feature | Detail |
|---|---|
| Auth | Email/password + Google + Apple + GitHub OAuth |
| Database | Postgres with RLS policies |
| Storage | `avatars` bucket — per-user RLS, 5MB limit, jpg/png/webp |
| Realtime | `useRealtimeTable` hook (web + native), Presence support |
| Connection pooling | PgBouncer pooler URL for Drizzle on Vercel (`prepare: false`, `max: 1`) |
| Direct URL | Used only by Drizzle Kit for migrations |
| Local development | Supabase CLI (`supabase start`) — local Postgres, Auth, Storage, Studio |
| Type generation | `supabase gen types typescript --local > packages/supabase/src/types.ts` |

---

## Database — Drizzle ORM

| Concern | Detail |
|---|---|
| Dialect | PostgreSQL |
| Schema location | `packages/api/src/db/schema.ts` |
| Migrations location | `packages/api/src/db/migrations/` |
| Workflow | `db:generate` → commit → `db:migrate` (never `db:push` in production) |
| CI check | Fails build if schema changes exist without a committed migration |
| Full-text search | `tsvector` generated column + GIN index + `plainto_tsquery` |

---

## API Layer — tRPC v11

```
Expo app
  └── tRPC HTTP client → Bearer token auth
        └── /api/trpc (Next.js route handler)
              └── tRPC router (packages/api)
                    └── Drizzle → Supabase Postgres

Next.js app
  └── tRPC React Query client → cookie-based auth
        └── /api/trpc (Next.js route handler)
              └── tRPC router (packages/api)
                    └── Drizzle → Supabase Postgres
```

Both auth methods handled in a single `createContext` function.

---

## Payments

| Platform | Tool | Notes |
|---|---|---|
| Web | Stripe | Checkout sessions + webhook handler at `/api/webhooks/stripe` |
| Native | RevenueCat | App Store + Play Store subscriptions, initialized after login with user ID |

Stripe is server-only. Never import the Stripe SDK in Expo. All payment logic triggered via tRPC mutations.

---

## Infrastructure & Services

| Category | Service | Purpose |
|---|---|---|
| Web hosting | Vercel | Next.js deployment, zero-config |
| Mobile builds | EAS Build | iOS + Android binary builds |
| Mobile OTA | EAS Update | JS bundle updates without App Store |
| Mobile submission | EAS Submit + Fastlane | App Store + Play Store |
| Error monitoring | Sentry | Web + native, shared dashboard |
| Logging | Pino + Axiom | Structured server logs, shipped to Axiom in prod |
| Analytics | PostHog | Web + native, feature flags, session replay |
| Uptime monitoring | Checkly | Synthetic checks every 1 min, 2 regions |
| Background jobs | Trigger.dev | Async tasks (email sending, webhooks, processing) |
| Email delivery | Resend | Transactional email with React Email templates |
| Rate limiting | Upstash Redis | Serverless Redis, sliding window per user |
| CMS (optional) | Sanity | Marketing pages, blog content |

---

## CI/CD — GitHub Actions

| Workflow | Trigger | Does |
|---|---|---|
| `ci.yml` | Every PR + push to main | Install, lint, typecheck, test, build, Lighthouse CI, Checkly deploy, secret scan |
| `eas-preview.yml` | Every PR | EAS Build preview (internal distribution) |
| `eas-update.yml` | Push to main | EAS Update → production OTA channel |
| `release.yml` | Push to main | Changesets → version bump PR or publish |
| `eas-production.yml` | Manual (`workflow_dispatch`) | EAS Build production + Fastlane submission |

---

## Developer Experience

| Tool | Purpose |
|---|---|
| `pnpm setup` | One-command onboarding: installs deps, starts Supabase, applies migrations, creates env files |
| Husky pre-commit | Runs lint-staged (Biome on staged files only) |
| Husky commit-msg | Validates conventional commit format |
| commitlint | Enforces `feat:`, `fix:`, `chore:` etc. |
| Renovate | Weekly dependency update PRs, grouped by ecosystem, auto-merges patches |
| Changesets | Tracks notable changes to `packages/*`, generates changelogs |
| `.env.example` files | Documents required env vars, committed to git |
| `.vscode/extensions.json` | Recommends Biome, Expo Tools, Tailwind IntelliSense, Playwright, GitLens |
| `.vscode/settings.json` | Biome as default formatter, format on save |
| `.vscode/launch.json` | Debugger configs for Next.js (server + client) and Expo |
| `.editorconfig` | Consistent indentation and line endings across all editors |
| PR template | Checklist: lint, typecheck, migration, changeset, env vars |

---

## Security

| Concern | Implementation |
|---|---|
| Security headers | next-safe: CSP, HSTS, X-Frame-Options, Permissions-Policy |
| Secret scanning | TruffleHog on every PR diff (verified secrets only) |
| Session encryption | MMKV AES-256 encryption for native session storage |
| RLS | All Supabase tables and Storage buckets protected by Row Level Security |
| Rate limiting | Upstash Redis sliding window on all public-facing tRPC procedures |
| Env validation | t3-env — build fails if required vars are missing or malformed |
| Service role key | Server-only, used only for admin operations (account deletion) |
| GDPR | Cookie consent banner, PostHog opt-out by default, data deletion endpoint |

---

## Testing

| Layer | Tool | What it tests |
|---|---|---|
| Unit | Vitest | Validators, business logic, tRPC routers |
| E2E web | Playwright | Next.js critical user flows |
| E2E native | Maestro | Expo critical user flows |
| Visual regression | Chromatic (optional) | `ui-web` component snapshots on every PR |
| Performance | Lighthouse CI | Core Web Vitals gated on PRs |
| Uptime | Checkly | API health + tRPC endpoint synthetic checks |

---

## Environment Variables — Full List

### `apps/nextjs`

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL                      ← pooler URL (runtime)
DATABASE_DIRECT_URL               ← direct URL (migrations only)
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
RESEND_API_KEY
TRIGGER_SECRET_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
AXIOM_TOKEN
AXIOM_DATASET
NEXT_PUBLIC_SANITY_PROJECT_ID     ← optional (CMS only)
NEXT_PUBLIC_SANITY_DATASET        ← optional (CMS only)
```

### `apps/expo`

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_SENTRY_DSN
EXPO_PUBLIC_POSTHOG_KEY
EXPO_PUBLIC_REVENUECAT_APPLE_KEY
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY
EXPO_PUBLIC_MMKV_ENCRYPTION_KEY
```

---

## GitHub Secrets — Full List

| Secret | Used by |
|---|---|
| `EXPO_TOKEN` | EAS Build, EAS Update |
| `SENTRY_AUTH_TOKEN` | Sentry source map uploads |
| `LHCI_GITHUB_APP_TOKEN` | Lighthouse CI PR comments |
| `CHECKLY_API_KEY` | Checkly deploy |
| `CHECKLY_ACCOUNT_ID` | Checkly deploy |
| `APP_STORE_KEY_ID` | Fastlane iOS |
| `APP_STORE_ISSUER_ID` | Fastlane iOS |
| `APP_STORE_KEY_CONTENT` | Fastlane iOS (`.p8` file, base64) |
| `PLAY_STORE_JSON_KEY` | Fastlane Android |
| `CHROMATIC_PROJECT_TOKEN` | Chromatic visual regression (optional) |

---

## Package Dependency Graph

```
apps/nextjs
  ├── @my-app/api              (server — tRPC context + Drizzle)
  ├── @my-app/supabase         (browser + server clients)
  ├── @my-app/ui-web           (web components)
  ├── @my-app/design-tokens    (tokens + utils + types)
  ├── @my-app/tailwind-config  (shared Tailwind theme)
  ├── @my-app/validators       (Zod schemas)
  └── @my-app/i18n             (translations)

apps/expo
  ├── @my-app/api              (DEV ONLY — types only, never runtime)
  ├── @my-app/supabase         (browser client)
  ├── @my-app/ui-native        (native components)
  ├── @my-app/design-tokens    (tokens + utils + types)
  ├── @my-app/tailwind-config  (shared Tailwind theme)
  ├── @my-app/validators       (Zod schemas)
  └── @my-app/i18n             (translations)

packages/api
  ├── @my-app/supabase
  └── @my-app/validators

packages/ui-web
  └── @my-app/design-tokens

packages/ui-native
  └── @my-app/design-tokens

packages/tailwind-config
  └── @my-app/design-tokens

packages/supabase
  └── (no internal deps)

packages/validators
  └── (no internal deps)

packages/design-tokens
  └── (no deps — pure TypeScript constants)

packages/i18n
  └── (no internal deps)
```

---

## Common Commands

```bash
# Setup
pnpm setup                                    # full onboarding from scratch

# Development
pnpm dev                                      # start all apps
pnpm --filter @my-app/nextjs dev              # web only
pnpm --filter @my-app/expo dev                # mobile only

# Supabase
pnpm supabase:start                           # start local Supabase
pnpm supabase:stop                            # stop local Supabase
pnpm supabase:reset                           # reset DB + re-run seed
pnpm supabase:types                           # regenerate TypeScript types

# Database
pnpm --filter @my-app/api db:generate         # generate migration from schema changes
pnpm --filter @my-app/api db:migrate          # apply pending migrations
pnpm --filter @my-app/api db:studio           # open Drizzle Studio

# Quality
pnpm lint                                     # lint all packages
pnpm typecheck                                # typecheck all packages
pnpm test                                     # run all unit tests
pnpm --filter @my-app/nextjs analyze          # analyze Next.js bundle

# Storybook (if set up)
pnpm --filter @my-app/ui-web storybook        # component development

# EAS
eas build --profile development --platform all   # dev client build
eas build --profile preview --platform all       # preview build
eas build --profile production --platform all    # production build
eas update --branch production                   # push OTA update
```

---

## Scaffold Documents Reference

| # | Document | Covers |
|---|---|---|
| 1 | `scaffold-instructions.md` | Core monorepo, Expo, Next.js, Supabase, tRPC, Drizzle |
| 2 | `scaffold-instructions-production-additions.md` | t3-env, Sentry, Upstash, Resend, Trigger.dev, PostHog, Stripe, RevenueCat, push notifications, EAS Update, Vitest, Playwright, Maestro, GitHub Actions |
| 3 | `scaffold-instructions-dx-and-workflow.md` | Husky, commitlint, local Supabase, Drizzle migration workflow, Renovate, Changesets, bundle analyzer, PR template, VSCode config, EditorConfig, onboarding script, `.env.example` |
| 4 | `scaffold-instructions-final-hardening.md` | Pino + Axiom logging, next-safe security headers, MMKV, Lighthouse CI, deep linking + Universal Links, Supabase Realtime, README, GDPR + cookie consent, Fastlane, i18n, offline support |
| 5 | `scaffold-instructions-remaining-gaps.md` | Connection pooling (PgBouncer), Checkly uptime monitoring, Supabase Storage uploads, Social OAuth (Google, Apple, GitHub), Apple Sign-In native, full-text search, Sanity CMS |
| 6 | `scaffold-instructions-design-system.md` | `design-tokens`, `tailwind-config`, `ui-native` components, `ui-web` components, Storybook, Chromatic |
