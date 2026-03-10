import { db } from "@my-app/db";
import { users } from "@my-app/db/schema";
import { updateAvatarSchema, userProfileSchema } from "@my-app/validators";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { protectedProcedure, router } from "../trpc";

export const userRouter = router({
  me: protectedProcedure.output(userProfileSchema).query(async ({ ctx }) => {
    logger.info({ userId: ctx.user.id }, "user.me called");

    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      avatarUrl: user.avatarUrl ?? null,
    };
  }),

  updateAvatar: protectedProcedure
    .input(updateAvatarSchema)
    .mutation(async ({ ctx, input }) => {
      await db
        .update(users)
        .set({ avatarUrl: input.avatarUrl })
        .where(eq(users.id, ctx.user.id));

      logger.info({ userId: ctx.user.id }, "user.updateAvatar completed");
      return { success: true };
    }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const { user, supabase } = ctx;

    await db.delete(users).where(eq(users.id, user.id));

    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    logger.info({ userId: user.id }, "user.deleteAccount completed");
    return { success: true };
  }),
});
