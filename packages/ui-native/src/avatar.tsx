import type { AvatarProps } from "@my-app/design-tokens/component-types";
import { getInitials } from "@my-app/design-tokens/utils";
import { Image, Text, View } from "react-native";

const sizes = {
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-14 h-14", text: "text-base" },
  xl: { container: "w-20 h-20", text: "text-lg" },
} as const;

export function Avatar({ src, alt, fallback, size = "md" }: AvatarProps) {
  const s = sizes[size];

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        accessibilityLabel={alt}
        className={`rounded-full ${s.container}`}
      />
    );
  }

  return (
    <View
      className={`rounded-full bg-blue-100 items-center justify-center ${s.container}`}
    >
      <Text className={`text-blue-700 font-medium ${s.text}`}>
        {getInitials(fallback ?? alt)}
      </Text>
    </View>
  );
}
