import * as React from "react";
import { cn } from "@/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  selected?: boolean;
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive, selected, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-md bg-bg-secondary p-6",
        "border border-border-subtle",
        interactive &&
          "transition-all duration-200 hover:border-border-strong hover:shadow-md",
        selected && "border-2 border-border-emphasis",
        className,
      )}
      {...props}
    />
  );
});
