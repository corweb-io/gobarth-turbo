import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

// Pass in cookies() from next/headers at the call site
export const createSupabaseServerClient = (cookieStore: {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
}) =>
  createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }>,
        ) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    },
  );
