import { Pressable, Text } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  className?: string;
};

export function Button({ label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-lg bg-blue-600 px-4 py-3 items-center"
    >
      <Text className="text-white font-semibold">{label}</Text>
    </Pressable>
  );
}
