import { PostHogProvider } from "posthog-react-native";
import { env } from "../env";

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider
      apiKey={env.EXPO_PUBLIC_POSTHOG_KEY}
      options={{ host: "https://app.posthog.com" }}
    >
      {children}
    </PostHogProvider>
  );
}
