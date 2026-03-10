"use client";
import { PHProvider } from "./posthog-provider";
import { TRPCProvider } from "./trpc-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <PHProvider>{children}</PHProvider>
    </TRPCProvider>
  );
}
