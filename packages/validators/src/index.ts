import { z } from "zod";
export { z };

// --- Input Schemas ---

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
});

export const updateAvatarSchema = z.object({
  avatarUrl: z.url(),
});

// --- Output Schemas ---

export const userProfileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().nullable(),
  avatarUrl: z.url().nullable(),
});

export const searchResultSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  body: z.string(),
  rank: z.number(),
});

// --- Pagination ---

export const cursorSchema = z.object({
  createdAt: z.iso.datetime(),
  id: z.uuid(),
});

export const cursorPaginationInputSchema = z.object({
  limit: z.number().min(1).max(50).default(10),
  cursor: cursorSchema.nullish(),
});

export function paginatedResultSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: cursorSchema.nullish(),
  });
}
