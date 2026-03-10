import type { InputProps } from "@my-app/design-tokens/component-types";
import { useId } from "react";
import { cn } from "./utils";

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  variant = "default",
  error,
  disabled,
  ...props
}: InputProps &
  Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "disabled" | "placeholder"
  >) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        value={value}
        onChange={(e) => onChangeText?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "rounded-md border px-3 py-2 text-sm outline-none transition-colors",
          "focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variant === "error" || error
            ? "border-error text-error"
            : "border-gray-300",
        )}
        {...props}
      />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
