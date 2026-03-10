import type { BadgeProps } from "@my-app/design-tokens/component-types";
import { cn } from "./utils";

const variantStyles = {
  default: "bg-gray-100 text-gray-800",
  success: "bg-success-light text-success-dark",
  warning: "bg-warning-light text-warning-dark",
  error: "bg-error-light text-error-dark",
  info: "bg-info-light text-info-dark",
} as const;

export function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
      )}
    >
      {children}
    </span>
  );
}
