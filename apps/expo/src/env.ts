import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    EXPO_PUBLIC_API_URL: z.string().url(),
    EXPO_PUBLIC_POSTHOG_KEY: z.string().min(1),
    EXPO_PUBLIC_SENTRY_DSN: z.string().url(),
  },
  runtimeEnv: {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  },
});
