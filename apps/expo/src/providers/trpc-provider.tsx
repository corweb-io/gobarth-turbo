import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { persister } from "../lib/query-persister";
import { supabase } from "../lib/supabase";
import { trpc } from "../lib/trpc";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours — keep cache for offline use
      staleTime: 1000 * 60 * 5, // 5 minutes — consider data stale after 5 min
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
  },
});

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/trpc`,
          async headers() {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            return {
              Authorization: session ? `Bearer ${session.access_token}` : "",
            };
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        {children}
      </PersistQueryClientProvider>
    </trpc.Provider>
  );
}
