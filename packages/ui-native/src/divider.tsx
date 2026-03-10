import type { DividerProps } from "@my-app/design-tokens/component-types";
import { View } from "react-native";

export function Divider({ orientation = "horizontal" }: DividerProps) {
  return (
    <View
      className={`bg-gray-200 ${
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full"
      }`}
    />
  );
}
