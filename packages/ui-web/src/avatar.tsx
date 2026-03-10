import type { AvatarProps } from "@my-app/design-tokens/component-types";
import { getInitials } from "@my-app/design-tokens/utils";
import { cn } from "./utils";

const sizeStyles = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-lg",
} as const;

export function Avatar({ src, alt, fallback, size = "md" }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? ""}
        className={cn("rounded-full object-cover", sizeStyles[size])}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-medium",
        sizeStyles[size],
      )}
    >
      {getInitials(fallback ?? alt)}
    </div>
  );
}
