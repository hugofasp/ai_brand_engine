import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
};

// Copy verbatim from NINEYARDS_STATIC_PAGES.md — "Page: Contact".
// Form wiring lands in Phase 4 (Resend integration). Phase 1 ships the
// page with a mailto fallback so the route exists end-to-end.
export default function ContactPage() {
  return (
    <article className="mx-auto max-w-[640px] px-6 py-20">
      <h1
        className="font-serif lowercase text-[48px] leading-[1.15]"
        style={{ letterSpacing: "-0.015em" }}
      >
        Contact
      </h1>

      <p className="mt-6 text-[18px] text-text-secondary">
        Questions, feedback, or interest in updates? Reach out below or email{" "}
        <a
          href="mailto:info@nineyards.pt"
          className="text-text-primary underline underline-offset-4"
        >
          info@nineyards.pt
        </a>{" "}
        directly.
      </p>

      <section
        className="mt-12 border-t pt-12"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <h2
          className="text-[12px] uppercase text-text-secondary"
          style={{ letterSpacing: "0.02em" }}
        >
          Direct
        </h2>
        <p className="mt-3 text-[20px]">
          <a
            href="mailto:info@nineyards.pt"
            className="text-text-primary underline underline-offset-4"
          >
            info@nineyards.pt
          </a>
        </p>
        <p className="mt-3 text-[14px] text-text-muted">
          We&apos;re a small team. Most replies come from Hugo, who built this.
        </p>
      </section>
    </article>
  );
}
