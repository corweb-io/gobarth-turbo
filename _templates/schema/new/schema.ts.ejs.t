---
to: packages/api/src/db/schema/<%= h.changeCase.kebab(name) %>.ts
---
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const <%= h.changeCase.camel(name) %> = pgTable("<%= h.changeCase.snake(name) %>", {
  id: uuid("id").primaryKey().defaultRandom(),
  // TODO: add columns
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
