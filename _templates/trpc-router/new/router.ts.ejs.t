---
to: packages/api/src/routers/<%= name %>.ts
---
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { logger } from "../lib/logger";

export const <%= h.changeCase.camel(name) %>Router = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    logger.info({ userId: ctx.user.id }, "<%= name %>.list called");
    // TODO: implement
    return [];
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      logger.info({ userId: ctx.user.id, id: input.id }, "<%= name %>.byId called");
      // TODO: implement
      throw new TRPCError({ code: "NOT_FOUND" });
    }),

  create: protectedProcedure
    .input(z.object({
      // TODO: define input schema
    }))
    .mutation(async ({ ctx, input }) => {
      logger.info({ userId: ctx.user.id }, "<%= name %>.create called");
      // TODO: implement
      return { success: true };
    }),
});
