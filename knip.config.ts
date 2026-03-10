import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    ".": {
      entry: ["scripts/*.sh"],
      ignoreDependencies: [
        // CLI tools used via pnpm exec / npx
        "@commitlint/cli",
        "@commitlint/config-conventional",
        "@changesets/cli",
        "husky",
        "lint-staged",
        "supabase",
        "hygen",
      ],
    },
    "apps/nextjs": {
      entry: [
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
        "src/app/**/route.ts",
        "src/app/**/loading.tsx",
        "src/app/**/error.tsx",
        "src/app/**/not-found.tsx",
        "src/middleware.ts",
        "next.config.ts",
        "sentry.*.config.ts",
        "playwright.config.ts",
        "checkly.config.ts",
      ],
      project: ["src/**/*.{ts,tsx}"],
      ignoreDependencies: [
        // Peer / implicit deps
        "@tailwindcss/postcss",
        "tailwindcss",
        // Sentry CLI used during build
        "@sentry/nextjs",
      ],
    },
    "apps/expo": {
      entry: ["src/app/**/*.tsx", "app.config.ts", "index.ts"],
      project: ["src/**/*.{ts,tsx}"],
      ignoreDependencies: ["tailwindcss", "nativewind", "@expo/metro-runtime"],
    },
    "apps/studio": {
      entry: ["sanity.config.ts"],
    },
    "packages/api": {
      entry: ["src/index.ts", "src/trpc.ts"],
      project: ["src/**/*.ts"],
      ignoreDependencies: [
        // Used as transport targets by pino
        "pino-axiom",
        "pino-pretty",
      ],
    },
    "packages/auth": {
      entry: ["src/index.ts"],
    },
    "packages/db": {
      entry: ["src/index.ts"],
    },
    "packages/ui-web": {
      entry: ["src/*.tsx"],
    },
    "packages/ui-native": {
      entry: ["src/*.tsx"],
    },
    "packages/validators": {
      entry: ["src/index.ts"],
    },
    "packages/i18n": {
      entry: ["src/index.ts"],
    },
    "packages/design-tokens": {
      entry: ["src/index.ts"],
    },
  },
  ignore: [
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/.turbo/**",
    "_templates/**",
  ],
  ignoreExportsUsedInFile: true,
};

export default config;
