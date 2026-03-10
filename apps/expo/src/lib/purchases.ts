import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

const REVENUECAT_APPLE_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY ?? "";
const REVENUECAT_GOOGLE_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY ?? "";

export function initPurchases(userId?: string) {
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

  if (Platform.OS === "ios") {
    Purchases.configure({ apiKey: REVENUECAT_APPLE_KEY, appUserID: userId });
  } else if (Platform.OS === "android") {
    Purchases.configure({ apiKey: REVENUECAT_GOOGLE_KEY, appUserID: userId });
  }
}

export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}
