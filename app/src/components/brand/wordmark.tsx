import Link from "next/link";
import { cn } from "@/lib/cn";

type WordmarkProps = {
  as?: "link" | "span";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap: Record<NonNullable<WordmarkProps["size"]>, string> = {
  sm: "text-[14px]",
  md: "text-[16px]",
  lg: "text-[18px]",
};

/**
 * Wordmark — terminal log register.
 *
 * Rendered as `> brand.soul OS` in mono. The `>` glyph blinks (same
 * cadence as the .terminal-cursor) to set the "prompt speaking"
 * register. Two parts carry the purple accent: the leading prompt
 * glyph ">" and the ".soul" suffix. The rest ("brand", " OS") stays
 * primary text.
 *
 * Brand rule:
 *  - "brand" stays lowercase.
 *  - ".soul" stays lowercase and purple (the soul-of-the-brand signal).
 *  - "OS" stays uppercase (acronym for operating system).
 *  - Never use "Brand.soul OS", "brand.soul os", or any other casing.
 */
export function Wordmark({ as = "link", size = "md", className }: WordmarkProps) {
  const content = (
    <span
      className={cn(
        "inline-flex items-baseline gap-[0.35em] font-mono font-medium text-text-primary",
        sizeMap[size],
        className,
      )}
      style={{ letterSpacing: "-0.01em" }}
    >
      <span
        aria-hidden="true"
        className="terminal-prompt-blink"
        style={{ color: "var(--color-accent-purple)" }}
      >
        &gt;
      </span>
      <span>
        brand
        <span style={{ color: "var(--color-accent-purple)" }}>.soul</span>
        {" OS"}
      </span>
    </span>
  );

  if (as === "span") return content;

  return (
    <Link
      href="/"
      aria-label="brand.soul OS, home"
      className="inline-flex items-center transition-opacity duration-150 hover:opacity-90"
    >
      {content}
    </Link>
  );
}
