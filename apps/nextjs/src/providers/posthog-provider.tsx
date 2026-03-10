"use client";
import { getCookie } from "cookies-next";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import { env } from "@/env";

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false,
      opt_out_capturing_by_default: true, // start opted out
    });

    // Only opt in if user has already consented
    const consent = getCookie("cookie-consent");
    if (consent === "accepted") {
      posthog.opt_in_capturing();
    }
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
