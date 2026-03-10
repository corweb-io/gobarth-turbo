import type { Database } from "@my-app/auth/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { initTRPC, TRPCError } from "@trpc/server";
import { logger } from "./lib/logger";
import { ratelimit } from "./lib/ratelimit";

export type Context = {
  supabase: SupabaseClient<Database>;
  user: { id: string; email: string } | null;
};

const t = initTRPC.context<Context>().create();

const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  if (result.ok) {
    logger.info({ path, type, durationMs }, "tRPC OK");
  } else {
    logger.error({ path, type, durationMs, error: result.error }, "tRPC Error");
  }

  return result;
});

export const router = t.router;

// Apply logging to all procedures
export const publicProcedure = t.procedure.use(loggerMiddleware);

export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return next({ ctx: { ...ctx, user: ctx.user } });
  });

export const rateLimitedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(async ({ ctx, next }) => {
    const identifier = ctx.user?.id ?? "anonymous";
    const { success } = await ratelimit.limit(identifier);
    if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    return next();
  });
