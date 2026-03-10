# Monorepo Scaffold Instructions
> Hand this document to an AI coding agent. Follow every step in order. Do not skip sections.

---

## 1. Overview

Scaffold a production-ready monorepo with the following apps and packages:

```
my-app/
├── apps/
│   ├── expo/          # React Native mobile app
│   └── nextjs/        # Next.js web app
└── packages/
    ├── supabase/      # Supabase client (browser + server) + generated types
    ├── api/           # tRPC v11 router
    ├── validators/    # Zod schemas (shared between apps)
    ├── ui-native/     # React Native UI components
    └── ui-web/        # shadcn/ui web components
```

---

## 2. Core Stack

| Concern | Choice |
|---|---|
| Monorepo orchestration | Turborepo |
| Package manager | pnpm workspaces |
| Language | TypeScript 5 |
| Lint + format | Biome |
| Mobile | Expo SDK 54, React Native 0.81, React 19 |
| Web | Next.js 15, React 19, App Router |
| Navigation (native) | Expo Router v4 |
| Navigation (web) | Next.js App Router |
| Styling (native) | NativeWind v5 + Tailwind CSS v4 |
| Styling (web) | Tailwind CSS v4 |
| UI (native) | Custom components in `packages/ui-native` |
| UI (web) | shadcn/ui in `packages/ui-web` |
| API layer | tRPC v11 + React Query v5 |
| Backend | Supabase (Auth + Postgres + Realtime) |
| ORM (server only) | Drizzle ORM + Drizzle Kit |
| Validation | Zod v3 |

---

## 3. Root Setup

### 3.1 Initialize the repo

```bash
mkdir my-app && cd my-app
git init
pnpm init
```

### 3.2 Root `package.json`

```json
{
  "name": "my-app",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "format": "biome format --write .",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "latest",
    "@biomejs/biome": "latest",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  }
}
```

### 3.3 `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### 3.4 `turbo.json`

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
    }
  }
}
```

### 3.5 `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

### 3.6 Root `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022"],
    "skipLibCheck": true
  }
}
```

### 3.7 `.gitignore`

```
node_modules
.turbo
.env
.env.local
dist
.next
```

---

## 4. `packages/validators`

Shared Zod schemas used across all apps and tRPC.

### `packages/validators/package.json`

```json
{
  "name": "@my-app/validators",
  "version": "0.1.0",
  "exports": {
    ".": "./src/index.ts"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

### `packages/validators/src/index.ts`

```ts
export { z } from "zod";

// Example shared schema
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});
```

---

## 5. `packages/supabase`

Exposes a browser client, a server client (SSR-safe), and re-exports generated DB types.

### `packages/supabase/package.json`

```json
{
  "name": "@my-app/supabase",
  "version": "0.1.0",
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client.ts",
    "./server": "./src/server.ts",
    "./types": "./src/types.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### `packages/supabase/src/client.ts`
Browser-safe Supabase client. Used in Next.js client components and Expo.

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export const createBrowserClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

### `packages/supabase/src/server.ts`
SSR-safe server client. Used in Next.js server components, route handlers, and tRPC context.

```ts
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

// Pass in cookies() from next/headers at the call site
export const createSupabaseServerClient = (cookieStore: {
  get: (name: string) => { value: string } | undefined;
}) =>
  createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
```

### `packages/supabase/src/types.ts`

```ts
// Run `supabase gen types typescript --project-id YOUR_PROJECT_ID > packages/supabase/src/types.ts`
// after setting up your Supabase project to populate this file.
export type Database = {};
```

### `packages/supabase/src/index.ts`

```ts
export { createBrowserClient } from "./client";
export { createSupabaseServerClient } from "./server";
export type { Database } from "./types";
```

---

## 6. `packages/api`

tRPC v11 router. Supabase server client is injected into context from the calling app.

### `packages/api/package.json`

```json
{
  "name": "@my-app/api",
  "version": "0.1.0",
  "exports": {
    ".": "./src/index.ts",
    "./trpc": "./src/trpc.ts"
  },
  "dependencies": {
    "@trpc/server": "^11.0.0",
    "@my-app/validators": "workspace:*",
    "@my-app/supabase": "workspace:*",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### `packages/api/src/trpc.ts`

```ts
import { initTRPC, TRPCError } from "@trpc/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@my-app/supabase/types";

export type Context = {
  supabase: SupabaseClient<Database>;
  user: { id: string; email: string } | null;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

### `packages/api/src/routers/user.ts`

```ts
import { router, protectedProcedure } from "../trpc";

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});
```

### `packages/api/src/index.ts`

```ts
import { router } from "./trpc";
import { userRouter } from "./routers/user";

export const appRouter = router({
  user: userRouter,
});

export type AppRouter = typeof appRouter;
```

---

## 7. `packages/ui-web`

Web-only UI using shadcn/ui. Install shadcn components as needed.

### `packages/ui-web/package.json`

```json
{
  "name": "@my-app/ui-web",
  "version": "0.1.0",
  "exports": {
    "./*": "./src/*.tsx"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "react": "^19.0.0",
    "@types/react": "^19.0.0"
  }
}
```

### `packages/ui-web/src/button.tsx`

```tsx
import { cn } from "./utils";

export function Button({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

---

## 8. `packages/ui-native`

Native-only UI using React Native primitives.

### `packages/ui-native/package.json`

```json
{
  "name": "@my-app/ui-native",
  "version": "0.1.0",
  "exports": {
    "./*": "./src/*.tsx"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "react": "^19.0.0",
    "@types/react": "^19.0.0",
    "react-native": "*"
  }
}
```

### `packages/ui-native/src/button.tsx`

```tsx
import { Pressable, Text } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  className?: string;
};

export function Button({ label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-lg bg-blue-600 px-4 py-3 items-center"
    >
      <Text className="text-white font-semibold">{label}</Text>
    </Pressable>
  );
}
```

---

## 9. `apps/nextjs`

### 9.1 Bootstrap

```bash
cd apps
pnpm create next-app@latest nextjs --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

### 9.2 `apps/nextjs/package.json` — add workspace dependencies

```json
{
  "name": "@my-app/nextjs",
  "dependencies": {
    "@my-app/api": "workspace:*",
    "@my-app/supabase": "workspace:*",
    "@my-app/ui-web": "workspace:*",
    "@my-app/validators": "workspace:*",
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "@trpc/server": "^11.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

### 9.3 `apps/nextjs/next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@my-app/api",
    "@my-app/supabase",
    "@my-app/ui-web",
    "@my-app/validators",
  ],
};

export default nextConfig;
```

### 9.4 tRPC context — `apps/nextjs/src/server/context.ts`

```ts
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@my-app/supabase/server";
import type { Context } from "@my-app/api/trpc";

export async function createContext(): Promise<Context> {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  return {
    supabase,
    user: user
      ? { id: user.id, email: user.email! }
      : null,
  };
}
```

### 9.5 tRPC route handler — `apps/nextjs/src/app/api/trpc/[trpc]/route.ts`

```ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@my-app/api";
import { createContext } from "@/server/context";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

### 9.6 Supabase auth middleware — `apps/nextjs/src/middleware.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### 9.7 Environment variables — `apps/nextjs/.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 10. `apps/expo`

### 10.1 Bootstrap

```bash
cd apps
pnpm create expo-app expo --template blank-typescript
```

### 10.2 `apps/expo/package.json` — add workspace dependencies

```json
{
  "name": "@my-app/expo",
  "dependencies": {
    "@my-app/ui-native": "workspace:*",
    "@my-app/validators": "workspace:*",
    "@supabase/supabase-js": "^2.45.0",
    "@react-native-async-storage/async-storage": "^2.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@tanstack/react-query": "^5.0.0",
    "expo-router": "^4.0.0",
    "nativewind": "^5.0.0",
    "react-native-safe-area-context": "^4.10.0",
    "react-native-screens": "^3.31.0"
  },
  "devDependencies": {
    "@my-app/api": "workspace:*",
    "tailwindcss": "^4.0.0"
  }
}
```

Note: `@my-app/api` is a **dev dependency** in Expo. It provides types only — the actual API runs in Next.js.

### 10.3 Supabase client for Expo — `apps/expo/src/lib/supabase.ts`

```ts
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Database } from "@my-app/supabase/types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // IMPORTANT: must be false for native
  },
});
```

### 10.4 tRPC client — `apps/expo/src/lib/trpc.ts`

```ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@my-app/api";

export const trpc = createTRPCReact<AppRouter>();
```

### 10.5 tRPC provider — `apps/expo/src/providers/trpc-provider.tsx`

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "../lib/trpc";
import { supabase } from "../lib/supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
```

### 10.6 NativeWind — `apps/expo/global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 10.7 `apps/expo/tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui-native/src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
};

export default config;
```

### 10.8 Environment variables — `apps/expo/.env.local`

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## 11. Drizzle ORM (server only)

Drizzle connects directly to Supabase's Postgres. Only use it in tRPC routers on the server — never expose this to the client as it bypasses RLS.

Install in `packages/api`:

```bash
pnpm add drizzle-orm postgres --filter @my-app/api
pnpm add -D drizzle-kit --filter @my-app/api
```

### `packages/api/src/db/index.ts`

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client);
```

### `packages/api/src/db/schema.ts`

```ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

Add to `apps/nextjs/.env.local`:
```
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

---

## 12. Supabase Auth in tRPC Context

Update `apps/nextjs/src/server/context.ts` to verify the JWT from the Supabase session when the request comes from Expo:

```ts
export async function createContext({ req }: { req: Request }): Promise<Context> {
  const authHeader = req.headers.get("Authorization");
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  let user = null;

  if (authHeader?.startsWith("Bearer ")) {
    // Native app sends JWT bearer token
    const token = authHeader.slice(7);
    const { data } = await supabase.auth.getUser(token);
    user = data.user ? { id: data.user.id, email: data.user.email! } : null;
  } else {
    // Web app uses cookie-based session
    const { data } = await supabase.auth.getUser();
    user = data.user ? { id: data.user.id, email: data.user.email! } : null;
  }

  return { supabase, user };
}
```

---

## 13. Final Steps After Scaffolding

1. **Install all dependencies** from the repo root:
   ```bash
   pnpm install
   ```

2. **Set up your Supabase project** at supabase.com and copy your project URL and anon key into all `.env.local` files.

3. **Generate TypeScript types** from your Supabase schema:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > packages/supabase/src/types.ts
   ```

4. **Push Drizzle schema** to Supabase:
   ```bash
   pnpm drizzle-kit push --filter @my-app/api
   ```

5. **Run all apps in development**:
   ```bash
   pnpm dev
   # or individually:
   pnpm --filter nextjs dev
   pnpm --filter expo dev
   ```

---

## 14. Key Rules for the Agent

- **Never import from `packages/api` at runtime in Expo** — it is a dev dependency for types only. All API calls go through tRPC HTTP to the Next.js server.
- **Never use the Drizzle `db` client in client-side code** — it bypasses Supabase RLS and exposes your database.
- **Never share UI components** between `ui-native` and `ui-web` — they are separate packages.
- **Do not configure Metro manually** — Expo SDK 52+ detects monorepos automatically via `expo/metro-config`.
- **Use `detectSessionInUrl: false`** in the Expo Supabase client — required for native.
- **Biome replaces ESLint and Prettier** — do not install or configure either.
- The `packages/supabase/src/server.ts` client must only be imported in server-side code (Next.js server components, route handlers, tRPC context).
