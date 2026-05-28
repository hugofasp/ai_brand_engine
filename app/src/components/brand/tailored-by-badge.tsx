import { NineyardsLogo } from "./nineyards-logo";

/**
 * Floating "Tailored by nineyards" agency-attribution badge.
 *
 * Fixed top-right of the viewport. Glass-morphism style — translucent
 * white background with backdrop blur + saturate, so it sits cleanly
 * on whatever's behind without competing with the platform UI. The
 * `pointer-events: none` line means it never intercepts clicks; the
 * anchor wrapper re-enables pointer events on just the link itself.
 *
 * Mounted once in `app/layout.tsx` so it appears on every route
 * (public + interview + admin). On routes that already render this
 * attribution inline (e.g. footer), they DON'T duplicate — we removed
 * the inline usages there to avoid the badge appearing twice.
 */
export function TailoredByBadge() {
  return (
    <a
      href="https://nineyards.pt"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Tailored by nineyards, opens nineyards.pt in a new tab"
      className="tailored-by-badge group"
    >
      <span className="tailored-by-badge__label">Tailored by</span>
      <span aria-hidden="true" className="tailored-by-badge__sep" />
      <span className="tailored-by-badge__logo">
        <NineyardsLogo variant="black" height={16} />
      </span>
    </a>
  );
}
