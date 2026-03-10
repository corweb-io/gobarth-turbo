import { db } from "@my-app/db";
import { posts } from "@my-app/db/schema";
import {
  cursorPaginationInputSchema,
  paginatedResultSchema,
  searchResultSchema,
  z,
} from "@my-app/validators";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { publicProcedure, router } from "../trpc";

export const searchRouter = router({
  posts: publicProcedure
    .input(
      z
        .object({
          query: z.string().min(1).max(100),
        })
        .merge(cursorPaginationInputSchema),
    )
    .output(paginatedResultSchema(searchResultSchema))
    .query(async ({ input }) => {
      const { query, limit, cursor } = input;

      const tsQuery = sql`plainto_tsquery('english', ${query})`;
      const tsVector = sql`to_tsvector('english', coalesce(${posts.title}, '') || ' ' || coalesce(${posts.body}, ''))`;

      const matchCondition = sql`${tsVector} @@ ${tsQuery}`;

      const cursorCondition = cursor
        ? or(
            lt(posts.createdAt, new Date(cursor.createdAt)),
            and(
              eq(posts.createdAt, new Date(cursor.createdAt)),
              lt(posts.id, cursor.id),
            ),
          )
        : undefined;

      const results = await db
        .select({
          id: posts.id,
          title: posts.title,
          body: posts.body,
          createdAt: posts.createdAt,
          rank: sql<number>`ts_rank(${tsVector}, ${tsQuery})`,
        })
        .from(posts)
        .where(and(matchCondition, cursorCondition))
        .orderBy(desc(posts.createdAt), desc(posts.id))
        .limit(limit + 1);

      const hasMore = results.length > limit;
      const items = hasMore ? results.slice(0, limit) : results;
      const lastItem = items[items.length - 1];

      const nextCursor =
        hasMore && lastItem?.createdAt
          ? {
              createdAt: lastItem.createdAt.toISOString(),
              id: lastItem.id,
            }
          : null;

      return {
        items: items.map(({ id, title, body, rank }) => ({
          id,
          title,
          body,
          rank,
        })),
        nextCursor,
      };
    }),
});
