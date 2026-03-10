"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { trpc } from "../lib/trpc";

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return trpc.user.deleteAccount.useMutation({
    onSuccess: () => {
      queryClient.clear();
      router.push("/");
    },
  });
}
