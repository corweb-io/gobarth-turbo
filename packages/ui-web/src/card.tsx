import type { CardProps } from "@my-app/design-tokens/component-types";
import { cn } from "./utils";

export function Card({ children, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm",
        padding && "p-6",
      )}
    >
      {children}
    </div>
  );
}
