import type { BadgeProps } from "@my-app/design-tokens/component-types";
import { Text, View } from "react-native";

const variantStyles = {
  default: { bg: "bg-gray-100", text: "text-gray-800" },
  success: { bg: "bg-green-100", text: "text-green-800" },
  warning: { bg: "bg-yellow-100", text: "text-yellow-800" },
  error: { bg: "bg-red-100", text: "text-red-800" },
  info: { bg: "bg-blue-100", text: "text-blue-800" },
} as const;

export function Badge({ variant = "default", children }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View className={`rounded-full px-2.5 py-0.5 self-start ${styles.bg}`}>
      <Text className={`text-xs font-medium ${styles.text}`}>{children}</Text>
    </View>
  );
}
