# DX & Team Workflow — Scaffold Instructions
> This is the third companion document. Apply after `scaffold-instructions.md` and `scaffold-instructions-production-additions.md` are complete.

---

## 1. Husky + lint-staged + commitlint

### 1.1 Install

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional -w
```

### 1.2 Initialize Husky

```bash
pnpm exec husky init
```

This creates a `.husky/` folder and adds a `prepare` script to the root `package.json`.

### 1.3 `.husky/pre-commit`

Runs lint-staged on every commit. Only lints files that are staged — fast even in a large monorepo.

```bash
#!/bin/sh
pnpm exec lint-staged
```

### 1.4 `.husky/commit-msg`

Validates commit message format against conventional commits spec.

```bash
#!/bin/sh
pnpm exec commitlint --edit "$1"
```

### 1.5 Root `package.json` — add lint-staged config

```json
{
  "lint-staged": {
    "**/*.{ts,tsx,js,jsx}": [
      "biome check --apply --no-errors-on-unmatched"
    ],
    "**/*.{json,md,yaml,yml}": [
      "biome format --write --no-errors-on-unmatched"
    ]
  }
}
```

### 1.6 `commitlint.config.ts` (root)

```ts
import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",     // new feature
        "fix",      // bug fix
        "chore",    // maintenance, deps
        "docs",     // documentation only
        "style",    // formatting, no logic change
        "refactor", // neither fix nor feat
        "test",     // adding or updating tests
        "ci",       // CI/CD changes
        "perf",     // performance improvement
        "revert",   // revert a previous commit
      ],
    ],
    "subject-case": [2, "always", "lower-case"],
    "subject-max-length": [2, "always", 100],
    "body-max-line-length": [2, "always", 200],
  },
};

export default config;
```

Valid commit message examples:
```
feat: add push notification support
fix: resolve session expiry on native
chore: update supabase-js to 2.46.0
ci: add EAS preview build workflow
```

---

## 2. Local Supabase Development

Never develop against your cloud Supabase project. Run Supabase locally via the CLI.

### 2.1 Install Supabase CLI

```bash
pnpm add -D supabase -w
```

### 2.2 Initialize

```bash
pnpm supabase init
```

This creates a `supabase/` folder at the repo root with:
```
supabase/
├── config.toml        # local Supabase config
├── migrations/        # SQL migration files
└── seed.sql           # optional seed data
```

### 2.3 `supabase/config.toml` — key settings to configure

```toml
project_id = "my-app"

[api]
port = 54421

[db]
port = 54422

[studio]
port = 54423

[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["exp://localhost:8081"]

[auth.email]
enable_confirmations = false  # easier for local dev
```

### 2.4 Start local Supabase

```bash
pnpm supabase start
```

This starts local Postgres, Auth, Storage, Realtime, and Studio (at `localhost:54423`).

### 2.5 Update local `.env.local` files to point to local Supabase

After `supabase start`, the CLI prints your local keys. Use those:

`apps/nextjs/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key   # printed by supabase start
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
DATABASE_URL=postgresql://postgres:postgres@localhost:54422/postgres
```

`apps/expo/.env.local`:
```bash
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54421
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> **Note for Expo:** When testing on a physical device, replace `localhost` with your machine's local IP (e.g. `192.168.1.x`). The device cannot reach your machine via `localhost`.

### 2.6 Add Supabase scripts to root `package.json`

```json
{
  "scripts": {
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:reset": "supabase db reset",
    "supabase:types": "supabase gen types typescript --local > packages/supabase/src/types.ts",
    "supabase:studio": "open http://localhost:54423"
  }
}
```

Run `pnpm supabase:types` every time you change your schema to regenerate TypeScript types.

### 2.7 `supabase/seed.sql` — local development seed data

```sql
-- Create test user (bypasses email confirmation)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

Seed runs automatically on `supabase db reset`.

---

## 3. Drizzle Migrations (Production-safe Workflow)

Replace `drizzle-kit push` (prototyping only) with a proper migration workflow.

### 3.1 `packages/api/drizzle.config.ts`

```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### 3.2 Add scripts to `packages/api/package.json`

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:drop": "drizzle-kit drop"
  }
}
```

### 3.3 Workflow for schema changes

**Step 1 — Edit your schema:**
```ts
// packages/api/src/db/schema.ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),          // new column
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Step 2 — Generate migration file:**
```bash
pnpm --filter @my-app/api db:generate
```
This creates `packages/api/src/db/migrations/0001_add_avatar_url.sql`. Commit this file to git.

**Step 3 — Apply migration locally:**
```bash
pnpm --filter @my-app/api db:migrate
```

**Step 4 — Regenerate Supabase types:**
```bash
pnpm supabase:types
```

**Step 5 — Apply migration in production (in CI or manually):**
```bash
DATABASE_URL=your-production-url pnpm --filter @my-app/api db:migrate
```

> **Rule:** Never edit migration files after they have been committed. Always generate new ones.

### 3.4 Add migration step to CI

Add this step to `.github/workflows/ci.yml` after the build step:

```yaml
- name: Check for uncommitted migrations
  run: |
    pnpm --filter @my-app/api db:generate
    if [ -n "$(git status --porcelain packages/api/src/db/migrations)" ]; then
      echo "Uncommitted migrations detected. Run pnpm db:generate and commit the result."
      exit 1
    fi
```

This catches developers who change the schema but forget to generate and commit the migration.

---

## 4. Renovate — Automated Dependency Updates

### `.github/renovate.json` (root)

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "schedule": ["before 9am on Monday"],
  "timezone": "Europe/Paris",
  "packageRules": [
    {
      "description": "Auto-merge patch and minor updates for dev dependencies",
      "matchDepTypes": ["devDependencies"],
      "matchUpdateTypes": ["patch", "minor"],
      "autoMerge": true
    },
    {
      "description": "Group all Expo SDK packages together",
      "matchPackagePatterns": ["^expo", "^@expo"],
      "groupName": "Expo SDK"
    },
    {
      "description": "Group all Supabase packages together",
      "matchPackagePatterns": ["^@supabase"],
      "groupName": "Supabase"
    },
    {
      "description": "Group all tRPC packages together",
      "matchPackagePatterns": ["^@trpc"],
      "groupName": "tRPC"
    },
    {
      "description": "Group all Sentry packages together",
      "matchPackagePatterns": ["^@sentry"],
      "groupName": "Sentry"
    },
    {
      "description": "Require manual review for major updates",
      "matchUpdateTypes": ["major"],
      "dependencyDashboardApproval": true
    }
  ],
  "ignoreDeps": [
    "react",
    "react-native"
  ]
}
```

> Enable Renovate by installing the [Renovate GitHub App](https://github.com/apps/renovate) on your repo. No other setup needed.

> `react` and `react-native` are ignored because their versions are tightly coupled to the Expo SDK version — only upgrade them when upgrading the SDK.

---

## 5. Changesets — Package Versioning & Changelogs

Only needed if your `packages/*` will be versioned independently or published. Still useful in a private monorepo for generating clean `CHANGELOG.md` files.

### 5.1 Install

```bash
pnpm add -D @changesets/cli -w
pnpm changeset init
```

This creates `.changeset/config.json`.

### 5.2 `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### 5.3 Workflow

**When you make a notable change, create a changeset:**
```bash
pnpm changeset
```
This prompts you to select which packages changed and write a summary. A markdown file is added to `.changeset/` — commit it with your PR.

**To apply changesets and bump versions:**
```bash
pnpm changeset version
```

**To generate changelogs:**
```bash
pnpm changeset publish
```

### 5.4 Add a release CI workflow — `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
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

      - name: Create release PR or apply changesets
        uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This automatically opens a "Version Packages" PR whenever there are pending changesets. Merging it bumps versions and updates changelogs.

---

## 6. Bundle Analyzer

### 6.1 Install

```bash
pnpm add -D @next/bundle-analyzer --filter @my-app/nextjs
```

### 6.2 `apps/nextjs/next.config.ts`

```ts
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  transpilePackages: [
    "@my-app/api",
    "@my-app/supabase",
    "@my-app/ui-web",
    "@my-app/validators",
  ],
};

export default withBundleAnalyzer(nextConfig);
```

### 6.3 Add script to `apps/nextjs/package.json`

```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

Run with:
```bash
pnpm --filter @my-app/nextjs analyze
```

Opens two interactive treemap views in the browser — client bundle and server bundle.

---

## 7. Secret Scanning in CI

Add this step to `.github/workflows/ci.yml` before the build step:

```yaml
- name: Scan for secrets
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
    head: HEAD
    extra_args: --only-verified
```

This scans every commit in the PR diff for verified secrets (real credentials, not test strings). Fails the build if any are found.

---

## 8. PR Template

### `.github/pull_request_template.md`

```markdown
## What does this PR do?

<!-- Brief description of the change -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Chore / refactor
- [ ] Documentation

## How to test

<!-- Steps to verify the change works -->

1.
2.
3.

## Checklist

- [ ] I have run `pnpm lint` and `pnpm typecheck` locally
- [ ] I have added or updated tests where relevant
- [ ] I have generated a migration if the DB schema changed (`pnpm db:generate`)
- [ ] I have added a changeset if this affects a shared package (`pnpm changeset`)
- [ ] I have updated `.env.local` documentation if new env vars were added

## Screenshots (if UI change)

<!-- Before / after screenshots or screen recordings -->
```

---

## 9. VSCode Workspace Configuration

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "expo.vscode-expo-tools",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-playwright.playwright",
    "github.vscode-github-actions",
    "streetsidesoftware.code-spell-checker",
    "usernamehw.errorlens",
    "eamodio.gitlens"
  ]
}
```

### `.vscode/settings.json`

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit",
    "quickfix.biome": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.exclude": {
    "**/node_modules": true,
    "**/.turbo": true,
    "**/dist": true,
    "**/.next": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

### `.vscode/launch.json`

Debugger configs for Next.js and Expo:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm --filter @my-app/nextjs dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Expo: debug",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm --filter @my-app/expo dev"
    }
  ]
}
```

---

## 10. EditorConfig

### `.editorconfig` (root)

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.{yaml,yml}]
indent_size = 2

[Makefile]
indent_style = tab
```

---

## 11. Developer Onboarding Script

Create a single script that sets up a new developer's environment from scratch.

### `scripts/setup.sh` (root)

```bash
#!/bin/bash
set -e

echo "🚀 Setting up my-app monorepo..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required. Install via https://nodejs.org"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required. Run: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required for local Supabase. Install via https://docker.com"; exit 1; }

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Set up git hooks
echo "🪝 Setting up Husky git hooks..."
pnpm exec husky install

# Copy env files if they don't exist
if [ ! -f apps/nextjs/.env.local ]; then
  cp apps/nextjs/.env.example apps/nextjs/.env.local
  echo "📋 Created apps/nextjs/.env.local — fill in your values"
fi

if [ ! -f apps/expo/.env.local ]; then
  cp apps/expo/.env.example apps/expo/.env.local
  echo "📋 Created apps/expo/.env.local — fill in your values"
fi

# Start local Supabase
echo "🗄️  Starting local Supabase..."
pnpm supabase start

# Generate types from local schema
echo "🔷 Generating Supabase TypeScript types..."
pnpm supabase:types

# Run migrations
echo "🗃️  Applying database migrations..."
pnpm --filter @my-app/api db:migrate

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Fill in missing values in apps/nextjs/.env.local and apps/expo/.env.local"
echo "  2. Run 'pnpm dev' to start all apps"
echo "  3. Open http://localhost:3000 for the web app"
echo "  4. Open http://localhost:54423 for Supabase Studio"
```

Make it executable:
```bash
chmod +x scripts/setup.sh
```

Add to root `package.json`:
```json
{
  "scripts": {
    "setup": "bash scripts/setup.sh"
  }
}
```

New developers run a single command:
```bash
pnpm setup
```

---

## 12. `.env.example` Files

Commit these to git so developers know which variables are required. Never commit `.env.local`.

### `apps/nextjs/.env.example`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Resend
RESEND_API_KEY=

# Trigger.dev
TRIGGER_SECRET_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### `apps/expo/.env.example`

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# API
EXPO_PUBLIC_API_URL=http://localhost:3000

# Sentry
EXPO_PUBLIC_SENTRY_DSN=

# PostHog
EXPO_PUBLIC_POSTHOG_KEY=

# RevenueCat
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=
```

Add to root `.gitignore`:
```
.env.local
.env*.local
!.env.example
```

---

## 13. Updated `turbo.json` with all tasks

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "analyze": {
      "dependsOn": ["^build"],
      "outputs": [".next/analyze/**"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

---

## 14. Key Rules for the Agent

- **Husky hooks must be executable.** After creating `.husky/pre-commit` and `.husky/commit-msg`, run `chmod +x .husky/*`.
- **Never commit `.env.local` files.** Only commit `.env.example` files with empty values.
- **Never use `drizzle-kit push` after initial setup.** Always use `db:generate` then `db:migrate`.
- **Migration files must be committed to git.** They live in `packages/api/src/db/migrations/` and are the source of truth for schema history.
- **`pnpm supabase:types` must be re-run after every schema change.** Add a reminder in the PR checklist.
- **Renovate ignores `react` and `react-native`.** These are tied to the Expo SDK version. Only upgrade them during an intentional Expo SDK upgrade.
- **The onboarding script assumes Docker is running** for local Supabase. This is a hard requirement — document it in the README.
- **`.vscode/settings.json` sets Biome as the default formatter.** Do not install the Prettier or ESLint VSCode extensions — they will conflict.
- **Changesets are only required for changes to `packages/*`.** Changes that only affect `apps/*` do not need a changeset.
