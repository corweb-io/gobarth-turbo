---
to: packages/ui-web/src/<%= h.changeCase.kebab(name) %>.tsx
---
import { cn } from "./utils";

export interface <%= name %>Props {
  className?: string;
  children?: React.ReactNode;
}

export function <%= name %>({ className, children, ...props }: <%= name %>Props & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // TODO: add styles
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
