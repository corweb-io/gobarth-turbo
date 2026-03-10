import * as Sentry from "@sentry/nextjs";
import { env } from "./src/env";

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
});
