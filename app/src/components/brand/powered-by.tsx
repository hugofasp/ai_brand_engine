import { NineyardsLogo } from "./nineyards-logo";
import { cn } from "@/lib/cn";

/**
 * Inline "Tailored by nineyards" attribution.
 *
 * Used in the footer. The floating top-right glass badge
 * (`<TailoredByBadge />`, mounted in the root layout) handles the
 * primary attribution; this inline variant complements it in the
 * footer.
 *
 * "Tailored by" rather than "Powered by" — emphasises agency-built /
 * craft over generic platform attribution.
 */
export function PoweredBy({
  className,
  logoHeight = 16,
}: {
  className?: string;
  logoHeight?: number;
}) {
  return (
    <a
      href="https://nineyards.pt"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Tailored by nineyards, opens nineyards.pt in a new tab"
      className={cn(
        "group inline-flex items-center gap-2 opacity-60 transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100",
        className,
      )}
    >
      <span
        className="hidden sm:inline font-sans text-[10px] font-medium uppercase"
        style={{
          letterSpacing: "0.18em",
          color: "var(--color-text-muted)",
        }}
      >
        Tailored by
      </span>
      <NineyardsLogo variant="black" height={logoHeight} />
    </a>
  );
}
