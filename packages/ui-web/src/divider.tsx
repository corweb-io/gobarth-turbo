import type { DividerProps } from "@my-app/design-tokens/component-types";
import { cn } from "./utils";

export function Divider({ orientation = "horizontal" }: DividerProps) {
  return (
    <div
      className={cn(
        "bg-gray-200",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
      )}
    />
  );
}
