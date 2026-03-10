import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return unsubscribe;
  }, []);

  if (!isOffline) return null;

  return (
    <View className="bg-yellow-500 px-4 py-2">
      <Text className="text-white text-center text-sm font-medium">
        You are offline. Showing cached data.
      </Text>
    </View>
  );
}
