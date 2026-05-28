import { Wordmark } from "@/components/brand/wordmark";

/**
 * Sticky top nav.
 *
 * Holds just the wordmark on the left. The agency-attribution is now
 * carried by the floating `<TailoredByBadge />` (mounted in the root
 * layout) so the nav stays clean and doesn't duplicate.
 */
export function TopNav() {
  return (
    <header
      className="sticky top-0 z-40 h-[72px] w-full border-b bg-bg-primary"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        <Wordmark />
      </div>
    </header>
  );
}
