# Data Flow & State Management

## Principles

1. **No global state store** — no Redux, Zustand, or custom context for server data
2. **React Query is the cache** — all server state lives in the React Query cache, accessed via tRPC hooks
3. **Supabase owns auth state** — session managed by Supabase SDK, not by React state
4. **Single source of truth** — every piece of data has exactly one owner

## Architecture Overview

```
┌──────────────┐     ┌──────────────┐
│  Next.js     │     │  Expo        │
│  (web)       │     │  (mobile)    │
└──────┬───────┘     └──────┬───────┘
       │                    │
       │  tRPC hooks        │  tRPC hooks
       │  (useQuery,        │  (useQuery,
       │   useMutation,     │   useMutation,
       │   useInfiniteQuery)│   useInfiniteQuery)
       │                    │
       └────────┬───────────┘
                │
         ┌──────▼──────┐
         │  tRPC API   │  Zod input validation
         │  (routers)  │  Zod output validation
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │  Drizzle    │  Type-safe queries
         │  ORM        │  Relational API
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │  Postgres   │  Supabase
         └─────────────┘
```

## Data Fetching

### Queries

Use tRPC query hooks. Data is cached and deduplicated automatically by React Query.

```tsx
const { data, isLoading } = trpc.user.me.useQuery();
```

### Paginated Queries

Use `useInfiniteQuery` with cursor-based pagination. All paginated endpoints return `{ items, nextCursor }`.

```tsx
const { data, hasNextPage, fetchNextPage } = trpc.search.posts.useInfiniteQuery(
  { query: "hello", limit: 10 },
  { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
);

const results = data?.pages.flatMap((page) => page.items) ?? [];
```

### Conditional Queries

Disable queries until a condition is met using `enabled`:

```tsx
const { data } = trpc.search.posts.useInfiniteQuery(
  { query: debouncedQuery, limit: 10 },
  { enabled: debouncedQuery.length > 1 },
);
```

## Mutations & Cache Invalidation

Every mutation must invalidate the queries it affects using `trpc.useUtils()`:

```tsx
const utils = trpc.useUtils();

const createPost = trpc.posts.create.useMutation({
  onSuccess: () => {
    utils.posts.list.invalidate();
  },
});
```

For destructive actions like account deletion, clear the entire cache:

```tsx
const queryClient = useQueryClient();

const deleteAccount = trpc.user.deleteAccount.useMutation({
  onSuccess: () => {
    queryClient.clear();
    router.push("/");
  },
});
```

### Rules

- Always invalidate related queries in `onSuccess`
- Use `utils.<router>.<procedure>.invalidate()` for targeted invalidation
- Use `queryClient.clear()` only when the entire cache is stale (e.g., sign-out, account deletion)
- Wrap mutations in custom hooks (e.g., `useDeleteAccount`) to co-locate the invalidation logic

## Realtime

Supabase Postgres Changes events are synced directly into the React Query cache via `useRealtimeSync`. This hook does **not** own data — it updates the existing cache entry so there is only one source of truth.

```tsx
// Data comes from the tRPC query
const { data } = trpc.posts.list.useQuery();

// Realtime events update that same cache entry
useRealtimeSync<Post>({
  table: "posts",
  queryKey: trpc.posts.list.getQueryKey(),
});
```

The hook accepts:

| Option     | Type                 | Description                           |
| ---------- | -------------------- | ------------------------------------- |
| `table`    | `string`             | Postgres table name                   |
| `queryKey` | `readonly unknown[]` | React Query key to update             |
| `filter`   | `string?`            | Supabase realtime filter (optional)   |

## File Uploads

Uploads go directly to Supabase Storage (client-side), then a tRPC mutation persists the URL to the database. This keeps large files off the API server while maintaining data integrity.

```
1. Client uploads file → Supabase Storage (direct)
2. Client calls tRPC mutation with the public URL
3. Mutation updates the DB row
4. onSuccess invalidates related queries
```

Example — avatar upload:

```tsx
const utils = trpc.useUtils();
const updateAvatar = trpc.user.updateAvatar.useMutation({
  onSuccess: () => utils.user.me.invalidate(),
});

// After successful storage upload:
updateAvatar.mutate({ avatarUrl: publicUrl });
```

## Authentication

Auth state is managed entirely by Supabase SDK — not stored in React state or React Query.

| Platform | Auth transport            | Session storage       |
| -------- | ------------------------- | --------------------- |
| Web      | Cookies (via SSR middleware) | Browser cookies     |
| Mobile   | Bearer token in header    | MMKV encrypted storage |

### Web flow

1. Next.js middleware refreshes the Supabase session on every request
2. tRPC context (`createContext`) reads session from cookies
3. `protectedProcedure` checks `ctx.user` — throws `UNAUTHORIZED` if null

### Mobile flow

1. Supabase client persists session to MMKV with auto-refresh
2. tRPC provider attaches `Bearer` token from session to every request
3. Same `protectedProcedure` check on the server

## Input & Output Validation

All tRPC procedures validate data at both ends using Zod schemas from `@my-app/validators`:

```tsx
// In the router
export const userRouter = router({
  me: protectedProcedure
    .output(userProfileSchema)      // validates response shape
    .query(async ({ ctx }) => {
      // ...
    }),

  updateAvatar: protectedProcedure
    .input(updateAvatarSchema)      // validates request input
    .mutation(async ({ ctx, input }) => {
      // ...
    }),
});
```

- **Input schemas** validate what comes in (user/client input)
- **Output schemas** validate what goes out (prevents leaking internal fields)
- Schemas live in `packages/validators/src/` and are shared across routers and clients

## Pagination Convention

All list endpoints use cursor-based pagination with the shared `cursorPaginationInputSchema`:

```tsx
// Input: { limit, cursor?: { createdAt, id } }
// Output: { items: T[], nextCursor?: { createdAt, id } }
```

The cursor uses `(createdAt, id)` as a composite key:

- `createdAt` provides temporal ordering
- `id` breaks ties for rows with identical timestamps
- Fetch `limit + 1` rows, check if extra row exists → `hasMore`

## Provider Hierarchy

### Web (Next.js)

```
<html>
  <body>
    <Providers>              ← client boundary
      <TRPCProvider>         ← QueryClient + tRPC client
        <PHProvider>         ← PostHog analytics
          {children}
        </PHProvider>
      </TRPCProvider>
    </Providers>
  </body>
</html>
```

### Mobile (Expo)

```
<TRPCProvider>               ← QueryClient + tRPC client + MMKV persistence
  <PostHogProvider>          ← PostHog analytics
    <Stack />                ← expo-router
  </PostHogProvider>
</TRPCProvider>
```

## Mobile-Specific: Offline Support

The Expo app persists the React Query cache to MMKV storage so data survives app restarts:

| Setting     | Value    | Purpose                              |
| ----------- | -------- | ------------------------------------ |
| `gcTime`    | 24 hours | Keep cached data for offline access  |
| `staleTime` | 5 min    | Refetch in background after 5 min   |
| `retry`     | 3        | Exponential backoff up to 30 seconds |

The persister throttles writes to MMKV at 1 write/second to avoid performance issues.

## Quick Reference

| Concern           | Owner                        | NOT this                     |
| ----------------- | ---------------------------- | ---------------------------- |
| Server data       | React Query (via tRPC)       | useState, Redux, Zustand     |
| Auth state        | Supabase SDK                 | React context, React Query   |
| Realtime updates  | useRealtimeSync → RQ cache   | Separate useState            |
| File uploads      | Supabase Storage + tRPC mutation | tRPC only               |
| Input validation  | Zod schemas in validators    | Manual checks in routers     |
| Output validation | Zod schemas via .output()    | Returning raw DB rows        |
| Pagination        | Cursor-based (createdAt, id) | Offset-based                 |
| Local UI state    | useState / useReducer        | React Query, global stores   |
