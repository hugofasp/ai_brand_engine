import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "transition-colors duration-150 " +
  "disabled:opacity-40 disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";

const sizes: Record<Size, string> = {
  sm: "h-8 px-4 text-[14px]",
  md: "h-10 px-6 text-[16px]",
  lg: "h-12 px-7 text-[16px]",
};

/**
 * All variants switch to `--color-accent-purple` on hover and active,
 * matching the system-wide rule that purple = interaction. Mobile/touch
 * triggers the same fill via `:active`.
 */
const variants: Record<Variant, string> = {
  primary:
    "bg-cta-bg text-cta-text hover:bg-[color:var(--color-accent-purple)] hover:text-cta-text active:bg-[color:var(--color-accent-purple-strong)]",
  secondary:
    "bg-transparent text-text-primary border border-border-emphasis hover:bg-[color:var(--color-accent-purple)] hover:text-cta-text hover:border-transparent active:bg-[color:var(--color-accent-purple-strong)]",
  ghost:
    "bg-transparent text-text-primary hover:text-[color:var(--color-accent-purple)] active:text-[color:var(--color-accent-purple-strong)]",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}): string {
  return cn(base, sizes[size], variants[variant], className);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

/**
 * Button — BUILD_SPEC §5.7. No chromatic destructive variant: destructive
 * actions use `primary` with an AlertTriangle icon prefix + accountable
 * microcopy. For anchors/Links, apply `buttonClasses(...)` directly.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses({ variant, size, className })}
        {...props}
      />
    );
  },
);
