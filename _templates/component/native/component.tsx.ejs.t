---
to: packages/ui-native/src/<%= h.changeCase.kebab(name) %>.tsx
---
import { View, Text } from "react-native";

export interface <%= name %>Props {
  children?: React.ReactNode;
  className?: string;
}

export function <%= name %>({ children, className, ...props }: <%= name %>Props) {
  return (
    <View className={className} {...props}>
      {typeof children === "string" ? <Text>{children}</Text> : children}
    </View>
  );
}
