import { searchRouter } from "./routers/search";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
  user: userRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
