export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onPress?: () => void;
}

export type InputVariant = "default" | "error";

export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  variant?: InputVariant;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
}

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
}

export interface CardProps {
  children: React.ReactNode;
  padding?: boolean;
}

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
}
