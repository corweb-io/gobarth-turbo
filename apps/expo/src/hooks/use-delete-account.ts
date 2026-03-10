import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { trpc } from "../lib/trpc";

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return trpc.user.deleteAccount.useMutation({
    onSuccess: async () => {
      queryClient.clear();
      await supabase.auth.signOut();
      router.replace("/(auth)/sign-in");
    },
  });
}
