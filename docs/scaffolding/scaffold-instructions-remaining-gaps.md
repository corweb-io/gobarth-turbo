# Remaining Gaps — Scaffold Instructions
> This is the fifth and final companion document. Apply after all four previous scaffold documents are complete.

---

## 1. Supabase Connection Pooling for Drizzle on Vercel

This is a hard technical requirement, not optional. Vercel serverless functions open a new Postgres connection on every invocation. Without PgBouncer, you will exhaust your Supabase connection limit under any meaningful load and start seeing "too many connections" errors in production.

### 1.1 Use the pooler connection string

In your Supabase dashboard → Project Settings → Database, you will find two connection strings:

- **Direct connection** — `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`
- **Pooler (PgBouncer)** — `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

Use the **pooler URL** for Drizzle in all serverless environments (Vercel, Trigger.dev).
Use the **direct URL** only for Drizzle Kit migrations (pooler does not support the DDL commands that migrations require).

### 1.2 Update `apps/nextjs/.env.local` and `.env.example`

```bash
# Pooler URL — used by Drizzle at runtime on Vercel
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres

# Direct URL — used by Drizzle Kit for migrations only
DATABASE_DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 1.3 Update `packages/api/src/db/index.ts`

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {
  prepare: false, // REQUIRED — pgbouncer does not support prepared statements
  max: 1,         // REQUIRED — limit connections per serverless function instance
});

export const db = drizzle(client);
```

### 1.4 Update `packages/api/drizzle.config.ts`

```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_DIRECT_URL!, // direct URL for migrations
  },
} satisfies Config;
```

### 1.5 Update `packages/api/src/db/index.ts` env validation

Add `DATABASE_DIRECT_URL` to `apps/nextjs/src/env.ts`:

```ts
server: {
  DATABASE_URL: z.string().url(),
  DATABASE_DIRECT_URL: z.string().url(),
  // ... other server vars
}
```

### 1.6 Update CI env vars in `.github/workflows/ci.yml`

```yaml
env:
  DATABASE_URL: postgresql://placeholder
  DATABASE_DIRECT_URL: postgresql://placeholder
```

---

## 2. Uptime Monitoring — Checkly

Sentry catches errors inside your app. Uptime monitoring catches the case where your app is completely unreachable. Checkly runs synthetic checks against your endpoints every minute and alerts you within 60 seconds of downtime.

### 2.1 Install Checkly CLI

```bash
pnpm add -D checkly --filter @my-app/nextjs
```

### 2.2 Initialize Checkly

```bash
pnpm exec checkly login
pnpm exec checkly init
```

This creates a `checkly.config.ts` at the root of `apps/nextjs`.

### 2.3 `apps/nextjs/checkly.config.ts`

```ts
import { defineConfig } from "checkly";
import { EmailAlertChannel, Frequency } from "checkly/constructs";

const emailAlert = new EmailAlertChannel("email-alert", {
  address: "your@email.com",
  sendRecovery: true,
  sendFailure: true,
  sendDegraded: true,
});

export default defineConfig({
  projectName: "my-app",
  logicalId: "my-app-monitoring",
  repoUrl: "https://github.com/yourorg/my-app",
  checks: {
    frequency: Frequency.EVERY_1M,
    locations: ["eu-west-1", "us-east-1"],
    tags: ["production"],
    alertChannels: [emailAlert],
    checkMatch: "**/__checks__/**/*.check.ts",
    browserChecks: {
      testMatch: "**/__checks__/**/*.spec.ts",
    },
  },
  cli: {
    runLocation: "eu-west-1",
  },
});
```

### 2.4 API health check — `apps/nextjs/src/app/api/health/route.ts`

```ts
import { db } from "@my-app/api/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Verify DB is reachable
    await db.execute(sql`SELECT 1`);
    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { status: "error", message: "Database unreachable" },
      { status: 503 }
    );
  }
}
```

### 2.5 Checkly API check — `apps/nextjs/__checks__/api-health.check.ts`

```ts
import { ApiCheck, AssertionBuilder } from "checkly/constructs";

new ApiCheck("api-health-check", {
  name: "API Health",
  activated: true,
  request: {
    url: "https://yourdomain.com/api/health",
    method: "GET",
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody("$.status").equals("ok"),
      AssertionBuilder.responseTime().lessThan(3000),
    ],
  },
});
```

### 2.6 Checkly tRPC check — `apps/nextjs/__checks__/trpc-health.check.ts`

```ts
import { ApiCheck, AssertionBuilder } from "checkly/constructs";

new ApiCheck("trpc-health-check", {
  name: "tRPC Endpoint",
  activated: true,
  request: {
    url: "https://yourdomain.com/api/trpc/user.me",
    method: "GET",
    assertions: [
      AssertionBuilder.statusCode().not().equals(500),
      AssertionBuilder.responseTime().lessThan(5000),
    ],
  },
});
```

### 2.7 Deploy checks to Checkly from CI — add to `.github/workflows/ci.yml`

```yaml
- name: Deploy Checkly monitoring
  if: github.ref == 'refs/heads/main'
  run: pnpm exec checkly deploy --force
  working-directory: apps/nextjs
  env:
    CHECKLY_API_KEY: ${{ secrets.CHECKLY_API_KEY }}
    CHECKLY_ACCOUNT_ID: ${{ secrets.CHECKLY_ACCOUNT_ID }}
```

### 2.8 Add GitHub secrets

| Secret | Where to get it |
|---|---|
| `CHECKLY_API_KEY` | app.checklyhq.com → Settings → API Keys |
| `CHECKLY_ACCOUNT_ID` | app.checklyhq.com → Settings → General |

---

## 3. Supabase Storage — File Uploads

Storage is in your stack but nothing is wired up. Profile pictures are the most common use case.

### 3.1 Create storage bucket in Supabase

In your local `supabase/migrations/`, create a new migration:

```bash
pnpm --filter @my-app/api db:generate --name create_storage_buckets
```

Add to the generated SQL file:

```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,          -- public bucket, avatars are readable by anyone
  5242880,       -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- RLS: users can only upload to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: anyone can read avatars (public bucket)
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### 3.2 Upload hook for Next.js — `apps/nextjs/src/hooks/use-upload.ts`

```ts
"use client";
import { createBrowserClient } from "@my-app/supabase/client";
import { useState } from "react";

export function useUpload(bucket: string) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const upload = async (file: File, path: string): Promise<string | null> => {
    setUploading(true);
    setError(null);

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
```

### 3.3 Avatar upload component — `apps/nextjs/src/components/avatar-upload.tsx`

```tsx
"use client";
import { useUpload } from "../hooks/use-upload";
import { useRef } from "react";

type Props = {
  userId: string;
  currentUrl: string | null;
  onUpload: (url: string) => void;
};

export function AvatarUpload({ userId, currentUrl, onUpload }: Props) {
  const { upload, uploading } = useUpload("avatars");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const path = `${userId}/avatar.${file.name.split(".").pop()}`;
    const url = await upload(file, path);
    if (url) onUpload(url);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {currentUrl && (
        <img
          src={currentUrl}
          alt="Avatar"
          className="w-20 h-20 rounded-full object-cover"
        />
      )}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Change avatar"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
```

### 3.4 Upload hook for Expo — `apps/expo/src/hooks/use-upload.ts`

```ts
import { supabase } from "../lib/supabase";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";

export function useUpload(bucket: string) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = async (
    userId: string
  ): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return null;

    const image = result.assets[0];
    if (!image?.uri) return null;

    setUploading(true);
    setError(null);

    try {
      const base64 = await FileSystem.readAsStringAsync(image.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const ext = image.uri.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, decode(base64), {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { pickAndUpload, uploading, error };
}
```

Install required Expo packages:

```bash
pnpm expo install expo-image-picker expo-file-system base64-arraybuffer --filter @my-app/expo
```

---

## 4. Social OAuth — Google, Apple, GitHub

Apple Sign-In is an App Store **requirement** if you offer any other social login on iOS. Wire up all three at once.

### 4.1 Enable providers in Supabase

In Supabase Studio → Authentication → Providers, enable:
- **Google** — paste your OAuth client ID and secret
- **Apple** — paste your Services ID, Team ID, Key ID, and private key
- **GitHub** — paste your OAuth app client ID and secret

Set the redirect URL for all providers to:
```
https://[project-ref].supabase.co/auth/v1/callback
```

### 4.2 OAuth for Next.js — `apps/nextjs/src/lib/auth.ts`

```ts
import { createBrowserClient } from "@my-app/supabase/client";

type Provider = "google" | "apple" | "github";

export async function signInWithOAuth(provider: Provider) {
  const supabase = createBrowserClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}
```

### 4.3 OAuth callback route — `apps/nextjs/src/app/auth/callback/route.ts`

```ts
import { createSupabaseServerClient } from "@my-app/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createSupabaseServerClient(cookies());
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
```

### 4.4 OAuth buttons component — `apps/nextjs/src/components/oauth-buttons.tsx`

```tsx
"use client";
import { signInWithOAuth } from "../lib/auth";

export function OAuthButtons() {
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => signInWithOAuth("google")}
        className="flex items-center justify-center gap-3 px-4 py-2 border rounded-md hover:bg-gray-50"
      >
        <img src="/icons/google.svg" alt="" className="w-5 h-5" />
        Continue with Google
      </button>

      <button
        onClick={() => signInWithOAuth("apple")}
        className="flex items-center justify-center gap-3 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900"
      >
        <img src="/icons/apple.svg" alt="" className="w-5 h-5" />
        Continue with Apple
      </button>

      <button
        onClick={() => signInWithOAuth("github")}
        className="flex items-center justify-center gap-3 px-4 py-2 border rounded-md hover:bg-gray-50"
      >
        <img src="/icons/github.svg" alt="" className="w-5 h-5" />
        Continue with GitHub
      </button>
    </div>
  );
}
```

### 4.5 OAuth for Expo — `apps/expo/src/lib/auth.ts`

```ts
import { supabase } from "./supabase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

type Provider = "google" | "apple" | "github";

export async function signInWithOAuth(provider: Provider) {
  const redirectUrl = Linking.createURL("/auth/callback");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("No OAuth URL returned");

  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectUrl
  );

  if (result.type === "success") {
    const { url } = result;
    const params = new URL(url);
    const code = params.searchParams.get("code");

    if (code) {
      const { error: sessionError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (sessionError) throw sessionError;
    }
  }
}
```

Install required Expo packages:

```bash
pnpm expo install expo-web-browser --filter @my-app/expo
```

### 4.6 Apple Sign-In for Expo (native, required for App Store)

Apple requires using the native Apple Sign-In on iOS — the web browser flow is not accepted.

```bash
pnpm expo install expo-apple-authentication --filter @my-app/expo
```

`apps/expo/src/lib/apple-auth.ts`:

```ts
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "./supabase";

export async function signInWithAppleNative() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) throw new Error("No identity token");

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });

  if (error) throw error;
}
```

Usage in your sign-in screen:

```tsx
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { signInWithAppleNative } from "../lib/apple-auth";
import { signInWithOAuth } from "../lib/auth";

// Show native Apple button on iOS, web-based on Android
{Platform.OS === "ios" ? (
  <AppleAuthentication.AppleAuthenticationButton
    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
    cornerRadius={8}
    style={{ width: "100%", height: 44 }}
    onPress={signInWithAppleNative}
  />
) : (
  <Pressable onPress={() => signInWithOAuth("apple")}>
    <Text>Continue with Apple</Text>
  </Pressable>
)}
```

### 4.7 Update `app.config.ts` for Apple authentication entitlement

```ts
export default {
  expo: {
    ios: {
      bundleIdentifier: "com.yourcompany.myapp",
      usesAppleSignIn: true, // REQUIRED — adds the entitlement
    },
  },
};
```

---

## 5. Full-text Search — Supabase `tsvector`

Supabase's built-in full-text search covers most use cases without needing Algolia or Typesense. Add this when you have searchable content.

### 5.1 Add search vector to your schema

In `packages/api/src/db/schema.ts`:

```ts
import { pgTable, text, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    // Generated column — auto-updated by Postgres
    searchVector: text("search_vector")
      .generatedAlwaysAs(
        sql`to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))`
      )
      .notNull(),
  },
  (table) => ({
    searchIndex: index("posts_search_idx").using(
      "gin",
      sql`to_tsvector('english', coalesce(${table.title}, '') || ' ' || coalesce(${table.body}, ''))`
    ),
  })
);
```

Generate and apply the migration:

```bash
pnpm --filter @my-app/api db:generate --name add_posts_search
pnpm --filter @my-app/api db:migrate
```

### 5.2 Search tRPC endpoint — `packages/api/src/routers/search.ts`

```ts
import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { db } from "../db";
import { posts } from "../db/schema";
import { sql, desc } from "drizzle-orm";

export const searchRouter = router({
  posts: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }) => {
      const results = await db
        .select({
          id: posts.id,
          title: posts.title,
          body: posts.body,
          rank: sql<number>`ts_rank(
            to_tsvector('english', coalesce(${posts.title}, '') || ' ' || coalesce(${posts.body}, '')),
            plainto_tsquery('english', ${input.query})
          )`,
        })
        .from(posts)
        .where(
          sql`to_tsvector('english', coalesce(${posts.title}, '') || ' ' || coalesce(${posts.body}, ''))
            @@ plainto_tsquery('english', ${input.query})`
        )
        .orderBy(desc(sql`rank`))
        .limit(input.limit);

      return results;
    }),
});
```

Register in `packages/api/src/index.ts`:

```ts
import { searchRouter } from "./routers/search";

export const appRouter = router({
  user: userRouter,
  search: searchRouter,
});
```

### 5.3 Search component for Next.js — `apps/nextjs/src/components/search.tsx`

```tsx
"use client";
import { trpc } from "../lib/trpc";
import { useState } from "react";
import { useDebounce } from "../hooks/use-debounce";

export function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = trpc.search.posts.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 1 }
  );

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="w-full px-4 py-2 border rounded-md"
      />
      {debouncedQuery.length > 1 && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-md shadow-lg z-10">
          {isLoading && (
            <p className="p-3 text-sm text-gray-500">Searching...</p>
          )}
          {data?.length === 0 && (
            <p className="p-3 text-sm text-gray-500">No results</p>
          )}
          {data?.map((result) => (
            <a
              key={result.id}
              href={`/posts/${result.id}`}
              className="block px-4 py-3 hover:bg-gray-50"
            >
              <p className="font-medium text-sm">{result.title}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

`apps/nextjs/src/hooks/use-debounce.ts`:

```ts
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

---

## 6. CMS — Sanity

Only add this if you have marketing pages, a blog, or any content managed by non-developers. If all content is user-generated and stored in your DB, skip this section.

### 6.1 Initialize Sanity studio

```bash
# Create studio as a new app in your monorepo
cd apps
pnpm create sanity@latest --project YOUR_PROJECT_ID --dataset production --template clean --output-path studio
```

This creates `apps/studio/`.

### 6.2 `apps/studio/package.json` — rename for workspace

```json
{
  "name": "@my-app/studio",
  "version": "0.1.0",
  "scripts": {
    "dev": "sanity dev",
    "build": "sanity build",
    "deploy": "sanity deploy"
  }
}
```

### 6.3 Define a blog post schema — `apps/studio/schemaTypes/post.ts`

```ts
import { defineField, defineType } from "sanity";

export const post = defineType({
  name: "post",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "publishedAt",
      type: "datetime",
    }),
    defineField({
      name: "excerpt",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "body",
      type: "array",
      of: [{ type: "block" }, { type: "image" }],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "publishedAt" },
  },
});
```

### 6.4 Install Sanity client in Next.js

```bash
pnpm add @sanity/client @sanity/image-url next-sanity --filter @my-app/nextjs
```

### 6.5 `apps/nextjs/src/lib/sanity.ts`

```ts
import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
});

const builder = imageUrlBuilder(sanityClient);

export const urlFor = (source: any) => builder.image(source);
```

### 6.6 Fetch posts in Next.js — `apps/nextjs/src/app/blog/page.tsx`

```tsx
import { sanityClient } from "@/lib/sanity";
import { groq } from "next-sanity";

const postsQuery = groq`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt
  }
`;

export default async function BlogPage() {
  const posts = await sanityClient.fetch(postsQuery);

  return (
    <main>
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      <div className="grid gap-6">
        {posts.map((post: any) => (
          <article key={post._id}>
            <a href={`/blog/${post.slug.current}`}>
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-gray-600 mt-1">{post.excerpt}</p>
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}
```

### 6.7 Enable Incremental Static Regeneration for blog posts

```tsx
// apps/nextjs/src/app/blog/[slug]/page.tsx
export const revalidate = 60; // revalidate every 60 seconds

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await sanityClient.fetch(
    groq`*[_type == "post" && slug.current == $slug][0]`,
    { slug: params.slug }
  );

  return <article>{/* render post */}</article>;
}
```

### 6.8 Add Sanity env vars to `apps/nextjs/.env.local` and `.env.example`

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
```

### 6.9 Add Sanity to `turbo.json` tasks

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", "public/build/**"]
    }
  }
}
```

### 6.10 Deploy Sanity Studio

```bash
pnpm --filter @my-app/studio deploy
```

This hosts the Studio at `https://your-project.sanity.studio`. Add non-developers as editors in the Sanity dashboard.

---

## 7. Complete Environment Variables — Final Reference

A consolidated list of every environment variable across all five documents.

### `apps/nextjs/.env.example`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database — use pooler URL for runtime, direct URL for migrations
DATABASE_URL=
DATABASE_DIRECT_URL=

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

# Axiom
AXIOM_TOKEN=
AXIOM_DATASET=

# Sanity (if using CMS)
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
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

# MMKV encryption
EXPO_PUBLIC_MMKV_ENCRYPTION_KEY=
```

---

## 8. Key Rules for the Agent

- **Always use the pooler `DATABASE_URL` for Drizzle at runtime** and the direct `DATABASE_DIRECT_URL` for Drizzle Kit migrations. Using the direct URL on Vercel will cause connection exhaustion under load.
- **`prepare: false` is mandatory** in the Drizzle postgres client when using PgBouncer. Omitting it causes cryptic errors that only appear under concurrent load.
- **Apple Sign-In on iOS must use the native flow** via `expo-apple-authentication`, not the web browser OAuth flow. App Review will reject apps that use the browser-based flow on iOS when a native option is available.
- **`usesAppleSignIn: true` must be in `app.config.ts`** — without this entitlement, the native Apple Sign-In button will crash at runtime.
- **Checkly checks must be deployed to take effect** — creating the check files locally does nothing until `checkly deploy` runs. This is wired up in CI to run on every push to main.
- **The health endpoint must check the database** — a health check that only returns 200 without verifying DB connectivity gives you false confidence. The implementation in section 2.4 verifies the DB is reachable.
- **Sanity ISR `revalidate` should be set per page** — blog index and post pages have different freshness requirements. Set `revalidate` conservatively (60s) and lower it only if editors need faster publishing feedback.
- **Storage RLS policies are required** — without them, any authenticated user can overwrite any other user's files. The policies in section 3.1 scope uploads to each user's own folder using `auth.uid()`.
- **Full-text search `plainto_tsquery` is safer than `to_tsquery`** — `to_tsquery` throws an error on malformed input (e.g. a bare `&`). `plainto_tsquery` treats the entire input as plain text and never throws.
- **Do not add Sanity if all content is user-generated** — it adds meaningful operational overhead (a third deployment, a content team workflow, webhook-based revalidation) for zero benefit if non-developers never edit content.
