# CLAUDE.md — Project Context for AI Assistants

## Project Overview

Cross-platform app monorepo (web + mobile) built with Turborepo + pnpm workspaces.

## Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Web          | Next.js 16 (App Router), React 19, Tailwind 4   |
| Mobile       | Expo 55, React Native 0.83, NativeWind 4         |
| API          | tRPC v11, React Query v5                         |
| Database     | Supabase (Postgres), Drizzle ORM                 |
| Auth         | Supabase Auth (OAuth: Google, Apple, GitHub)      |
| Validation   | Zod v4 (shared via `@my-app/validators`)         |
| Styling      | Tailwind CSS 4 (web), NativeWind 4 (native)      |
| Code Quality | Biome (lint + format), TypeScript 5 strict        |
| Testing      | Vitest (unit), Playwright (E2E web)               |
| CI/CD        | GitHub Actions, Turborepo, Changesets             |
| Hosting      | Vercel (web), EAS Build/Update (mobile)           |

## Monorepo Structure

```
apps/
  nextjs/        → Next.js 16 web app (@my-app/nextjs)
  expo/          → Expo mobile app (@my-app/expo)
  studio/        → Sanity CMS (optional)

packages/
  api/           → tRPC routers + email templates (@my-app/api)
  db/            → Drizzle ORM schema, migrations, connection (@my-app/db)
  auth/          → Supabase Auth wrappers, session helpers, generated types (@my-app/auth)
  ui-web/        → shadcn/ui web components (@my-app/ui-web)
  ui-native/     → NativeWind native components (@my-app/ui-native)
  validators/    → Shared Zod schemas (@my-app/validators)
  i18n/          → i18next translations (en, fr) (@my-app/i18n)
  design-tokens/ → Colors, spacing, typography constants (@my-app/design-tokens)
```

## Key Commands

```bash
pnpm dev              # Start all apps (web + mobile)
pnpm dev:web          # Start only Next.js
pnpm dev:mobile       # Start only Expo
pnpm build            # Build all packages
pnpm lint             # Lint all packages (Biome)
pnpm format           # Format all files (Biome)
pnpm typecheck        # Typecheck all packages
pnpm test             # Run Vitest unit tests
pnpm setup            # First-time onboarding (installs deps, starts Supabase)

# Database
pnpm --filter @my-app/db db:generate  # Generate Drizzle migration
pnpm --filter @my-app/db db:migrate   # Run migrations
pnpm --filter @my-app/db db:studio    # Open Drizzle Studio

# Supabase
pnpm supabase:start   # Start local Supabase
pnpm supabase:stop    # Stop local Supabase
pnpm supabase:reset   # Reset DB + re-seed
pnpm supabase:types   # Regenerate TypeScript types
```

## Coding Conventions

### File Naming
- **Files:** kebab-case (`user-router.ts`, `create-user.ts`)
- **Components:** PascalCase (`Button.tsx` → exports `Button`)
- **Types/Interfaces:** PascalCase (`UserRouter`, `CreateUserInput`)
- **Functions:** camelCase (`createUser`, `formatDate`)

### TypeScript
- Strict mode always enabled
- Use `as const` for token/literal values
- Prefer explicit return types on exported functions
- Use workspace imports: `@my-app/api`, `@my-app/validators`, etc.

### tRPC Routers (packages/api)
- Use `publicProcedure`, `protectedProcedure`, or `rateLimitedProcedure`
- Always validate input with `.input(z.object({...}))`
- Use `TRPCError` with appropriate codes for errors
- Log operations with the `logger` singleton (Pino)
- Database access via `db` singleton from `@my-app/db`

### UI Components
- Web: shadcn/ui patterns in `packages/ui-web/src/`
- Native: NativeWind patterns in `packages/ui-native/src/`
- Use `cn()` utility for Tailwind class merging
- Props types defined in `packages/design-tokens/src/component-types.ts`
- Support `className` prop override, spread `...props`

### Validation
- Define shared schemas in `packages/validators/src/`
- Use `safeParse()` for validation (returns `{ success, data, error }`)
- Name schemas with action prefix: `createUserSchema`, `updatePostSchema`

### Database (Drizzle ORM)
- Schema in `packages/db/src/schema.ts`
- Use `uuid().primaryKey().defaultRandom()` for IDs
- Use `timestamp().defaultNow()` for timestamps
- Set `prepare: false` for pgbouncer compatibility
- Set `max: 1` connection pool size (serverless)

### Environment Variables
- Validated at runtime with `@t3-oss/env-nextjs` (web) and `@t3-oss/env-core` (mobile)
- Web env: `apps/nextjs/src/env.ts`
- Mobile env: `apps/expo/src/env.ts`
- Never commit `.env.local` — use `.env.example` as reference

### Testing
- Unit tests: Vitest with globals (`describe`, `it`, `expect` auto-imported)
- Place tests next to source: `user.test.ts` beside `user.ts`
- E2E tests: Playwright in `apps/nextjs/e2e/`
- Use semantic selectors: `getByRole()`, `getByText()`, `getByLabel()`

### Git & CI
- Conventional commits enforced (commitlint): `feat:`, `fix:`, `chore:`, etc.
- Pre-commit: lint-staged (Biome check on staged files)
- Pre-push: typecheck all packages
- CI: lint → typecheck → test → build → migration check
- Use Changesets for versioning (`pnpm changeset`)

## Architecture Decisions

- **Server state:** React Query via tRPC (no global state store)
- **Auth:** Supabase Auth with OAuth providers — never custom JWT
- **Logging:** Pino → Axiom (production), pino-pretty (development)
- **Rate limiting:** Upstash Redis sliding window via tRPC middleware
- **Emails:** Resend + React Email templates in `packages/api`
- **Payments:** Stripe (web), RevenueCat (mobile)
- **Background jobs:** Trigger.dev
- **Monitoring:** Sentry (errors), PostHog (analytics), Checkly (uptime)

## Don'ts

- Don't use `npm` or `yarn` — this project uses `pnpm`
- Don't import from relative paths across packages — use `@my-app/*`
- Don't add global state management (Redux, Zustand) — use React Query
- Don't skip Zod validation on tRPC inputs
- Don't commit `.env.local` or secrets
- Don't use `console.log` in production code — use the `logger`
