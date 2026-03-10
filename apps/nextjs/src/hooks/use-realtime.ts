"use client";
import { createBrowserClient } from "@my-app/auth/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

interface HasId {
  id: string;
}

type UseRealtimeSyncOptions = {
  table: string;
  queryKey: readonly unknown[];
  filter?: string;
};

export function useRealtimeSync<T extends HasId>({
  table,
  queryKey,
  filter,
}: UseRealtimeSyncOptions): void {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        (payload) => {
          queryClient.setQueryData<T[]>(queryKey, (old) => {
            if (!old) return old;

            if (payload.eventType === "INSERT") {
              return [...old, payload.new as T];
            }
            if (payload.eventType === "UPDATE") {
              return old.map((item) =>
                item.id === (payload.new as T).id ? (payload.new as T) : item,
              );
            }
            if (payload.eventType === "DELETE") {
              return old.filter((item) => item.id !== (payload.old as T).id);
            }
            return old;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, supabase, queryClient, queryKey]);
}
