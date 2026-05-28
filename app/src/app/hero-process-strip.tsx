/**
 * Horizontal process strip — the four-step flow of the platform, shown
 * below the hero CTA so a visitor sees, in one sweep, what the tool
 * actually does.
 *
 * Visual register:
 *  - Mono everywhere (matches the platform).
 *  - Step numbers in terminal-green (same colour family as the wordmark
 *    `>` and the `brand` word in the H1).
 *  - Labels lowercase + small caps (consistent with the wordmark rule).
 *  - Caption in muted mono.
 *  - Steps separated by `→` glyphs on desktop; stack vertically on mobile.
 */

type Step = {
  index: string;
  label: string;
  caption: string;
};

const STEPS: Step[] = [
  {
    index: "01",
    label: "interview",
    caption: "guided, 20-40 min",
  },
  {
    index: "02",
    label: "brand files",
    caption: "dna pack generated for your business",
  },
  {
    index: "03",
    label: "feeds every ai you use",
    caption: "agents, copilots, orchestrators, assistants",
  },
  {
    index: "04",
    label: "one voice, every team",
    caption: "on-brand outputs every time",
  },
];

export function HeroProcessStrip() {
  return (
    <section
      aria-label="How it works"
      className="mt-20 border-t pt-10 md:mt-24"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <p
        className="font-mono text-[11px] uppercase text-text-muted"
        style={{ letterSpacing: "0.18em" }}
      >
        {"// how it works"}
      </p>

      <ol className="mt-6 grid gap-8 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-start md:gap-4">
        {STEPS.map((step, i) => (
          <li
            key={step.index}
            className="contents"
          >
            <div className="font-mono">
              <p
                className="text-[11px] uppercase"
                style={{
                  color: "var(--color-accent-green)",
                  letterSpacing: "0.18em",
                }}
              >
                {step.index}
              </p>
              <p
                className="mt-2 text-[15px] font-medium text-text-primary md:text-[16px]"
                style={{ letterSpacing: "-0.01em" }}
              >
                {step.label}
              </p>
              <p className="mt-1 text-[12px] text-text-muted">
                {step.caption}
              </p>
            </div>
            {i < STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className="hidden text-[18px] text-text-muted md:block"
                style={{ marginTop: "18px" }}
              >
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
