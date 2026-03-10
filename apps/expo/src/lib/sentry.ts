import * as Sentry from "@sentry/react-native";
import { env } from "../env";

export function initSentry() {
  Sentry.init({
    dsn: env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    enableNativeFramesTracking: true,
  });
}
