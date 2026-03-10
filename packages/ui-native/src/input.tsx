import type { InputProps } from "@my-app/design-tokens/component-types";
import { Text, TextInput, View } from "react-native";

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  variant = "default",
  error,
  disabled,
  secureTextEntry,
}: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={!disabled}
        secureTextEntry={secureTextEntry}
        className={`rounded-md border px-3 py-2 text-sm ${
          variant === "error" || error
            ? "border-red-500 text-red-500"
            : "border-gray-300"
        } ${disabled ? "opacity-50" : ""}`}
      />
      {error && <Text className="text-sm text-red-500">{error}</Text>}
    </View>
  );
}
