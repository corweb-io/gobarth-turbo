# Database Workflow — Adding & Modifying Tables

## Overview

Drizzle ORM is the source of truth for your database schema. All table changes start in the Drizzle schema file and flow outward to migrations, types, validators, and API routers.

```
schema.ts → db:generate → db:migrate → supabase:types → validators → tRPC router
```

## Step-by-Step

### 1. Define the Drizzle schema

Add or modify tables in `packages/db/src/schema.ts`:

```ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Conventions:**

- Table names: `snake_case`, plural (`bookings`, `order_items`)
- Column names: `snake_case` in SQL (`user_id`), `camelCase` in TypeScript (`userId`)
- Always use `uuid().primaryKey().defaultRandom()` for IDs
- Always use `timestamp().defaultNow()` for `created_at` / `updated_at`

### 2. Generate a migration

```bash
pnpm --filter @my-app/db db:generate
```

This creates a `.sql` migration file from the diff between your schema and the current database state. Review the generated SQL before applying.

### 3. Apply the migration

```bash
pnpm --filter @my-app/db db:migrate
```

Runs the migration against your local Supabase Postgres instance.

### 4. Regenerate Supabase types

```bash
pnpm supabase:types
```

Updates the `Database` type in `packages/auth/src/types.ts` so the Supabase client stays in sync with the new schema.

### 5. Add Zod input schemas

Define validation schemas in `packages/validators/src/`:

```ts
import { z } from "zod";

export const createBookingSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
});

export const updateBookingSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "cancelled"]),
});
```

**Why separate from Drizzle?** Input shapes rarely match row shapes exactly — inputs omit auto-generated fields (`id`, `createdAt`) and may have stricter constraints.

### 6. Create a tRPC router

Add a router in `packages/api/src/routers/`:

```ts
// packages/api/src/routers/booking.ts
import { router, protectedProcedure } from "../trpc";
import { db } from "@my-app/db";
import { bookings } from "@my-app/db/schema";
import { createBookingSchema, updateBookingSchema } from "@my-app/validators";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const bookingRouter = router({
  create: protectedProcedure
    .input(createBookingSchema)
    .mutation(async ({ input }) => {
      const [booking] = await db.insert(bookings).values(input).returning();
      return booking;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.id));

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return booking;
    }),
});
```

### 7. Wire the router

Register the new router in `packages/api/src/index.ts`:

```ts
import { bookingRouter } from "./routers/booking";

export const appRouter = router({
  // ...existing routers
  booking: bookingRouter,
});
```

## Type Flow Diagram

```
┌─────────────────────────┐
│  Drizzle schema.ts      │  Source of truth for DB shape
│  (packages/db)          │
└────────┬────────────────┘
         │ db:generate + db:migrate
         ▼
┌─────────────────────────┐
│  Postgres (Supabase)    │  Actual database
└────────┬────────────────┘
         │ supabase:types
         ▼
┌─────────────────────────┐
│  Database type           │  Auth client typing
│  (packages/auth)         │
└──────────────────────────┘

┌─────────────────────────┐
│  Zod schemas             │  Input validation (independent)
│  (packages/validators)   │
└────────┬────────────────┘
         │ .input(schema)
         ▼
┌─────────────────────────┐
│  tRPC routers            │  Bridges Zod (in) + Drizzle (out)
│  (packages/api)          │
└────────┬────────────────┘
         │ type inference
         ▼
┌─────────────────────────┐
│  Client apps             │  Fully typed API calls
│  (nextjs / expo)         │
└──────────────────────────┘
```

## Quick Reference

| Action                  | Command                              |
| ----------------------- | ------------------------------------ |
| Generate migration      | `pnpm --filter @my-app/db db:generate` |
| Apply migration         | `pnpm --filter @my-app/db db:migrate`  |
| Open Drizzle Studio     | `pnpm --filter @my-app/db db:studio`   |
| Regenerate Supabase types | `pnpm supabase:types`              |
| Reset local DB + re-seed | `pnpm supabase:reset`               |
