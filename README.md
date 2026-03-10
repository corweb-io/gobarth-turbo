# My App

A cross-platform app built with Expo (iOS/Android) and Next.js (web), sharing a unified backend via Supabase and tRPC.

## Stack

| Layer | Technology |
|---|---|
| Mobile | Expo SDK 55, React Native 0.83, Expo Router |
| Web | Next.js 16, App Router |
| API | tRPC v11, React Query v5 |
| Auth + DB | Supabase (Auth, Postgres, Realtime, Storage) |
| ORM | Drizzle ORM |
| Styling | NativeWind v4 + Tailwind CSS |
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
  i18n/       # Shared translations
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
pnpm dev          # start all apps
pnpm dev:web      # web only
pnpm dev:mobile   # mobile only
```

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| Supabase Studio | http://localhost:54423 |
| Drizzle Studio | http://localhost:4983 |

## Common tasks

```bash
# Quality
pnpm lint                  # lint all packages
pnpm typecheck             # typecheck all packages
pnpm test                  # run all unit tests
pnpm test:watch            # unit tests in watch mode
pnpm test:e2e              # run Playwright E2E tests
pnpm knip                  # find dead code & unused deps

# Database
pnpm supabase:types        # regenerate types after schema change
pnpm --filter @my-app/api db:generate  # generate migration after schema edit
pnpm --filter @my-app/api db:migrate   # apply migrations locally

# Analysis
pnpm --filter @my-app/nextjs analyze   # analyze Next.js bundle
pnpm storybook             # browse component catalog

# Code generators (Hygen)
pnpm gen:package            # scaffold a new workspace package
pnpm gen:router             # scaffold a new tRPC router + test
pnpm gen:component:web      # scaffold a web UI component + story
pnpm gen:component:native   # scaffold a native UI component
pnpm gen:schema             # scaffold a new Drizzle table schema
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

For a detailed guide on where to get each value, see [docs/env-setup.md](docs/env-setup.md).

## Turbo Remote Caching

Enable remote caching to share build artifacts between CI and local machines:

```bash
# One-time setup (requires Vercel account)
pnpm turbo login
pnpm turbo link
```

Once linked, Turborepo will automatically cache and restore build outputs across all machines. This dramatically speeds up CI and local rebuilds when switching branches.
