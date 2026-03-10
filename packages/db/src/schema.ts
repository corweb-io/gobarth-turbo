import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    // Generated column — auto-updated by Postgres
    searchVector: text("search_vector")
      .generatedAlwaysAs(
        sql`to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))`,
      )
      .notNull(),
  },
  (table) => ({
    searchIndex: index("posts_search_idx").using(
      "gin",
      sql`to_tsvector('english', coalesce(${table.title}, '') || ' ' || coalesce(${table.body}, ''))`,
    ),
    userIdIndex: index("posts_user_id_idx").on(table.userId),
  }),
);

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));
