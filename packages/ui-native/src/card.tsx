import type { CardProps } from "@my-app/design-tokens/component-types";
import { shadowsNative } from "@my-app/design-tokens/shadows";
import { View } from "react-native";

export function Card({ children, padding = true }: CardProps) {
  return (
    <View
      className={`rounded-lg border border-gray-200 bg-white ${
        padding ? "p-6" : ""
      }`}
      style={shadowsNative.sm}
    >
      {children}
    </View>
  );
}
