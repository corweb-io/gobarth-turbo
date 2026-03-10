import { cn } from "./utils";

export function Button({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
