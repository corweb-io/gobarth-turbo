import type { Database } from "@my-app/auth/types";
import { createClient } from "@supabase/supabase-js";
import { env } from "../env";
import { mmkvStorageAdapter } from "./storage";

export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: mmkvStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
