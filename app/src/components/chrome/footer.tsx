import Link from "next/link";
import { PoweredBy } from "@/components/brand/powered-by";

/**
 * Site footer — copy from NINEYARDS_STATIC_PAGES.md (Footer section).
 * Three columns on desktop; stacks on mobile.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-24 border-t bg-bg-primary"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p
              className="font-mono text-[20px]"
              style={{ letterSpacing: "-0.01em" }}
            >
              <span style={{ color: "var(--color-accent-purple)" }}>
                &gt;{" "}
              </span>
              brand
              <span style={{ color: "var(--color-accent-purple)" }}>
                .soul
              </span>
              {" OS"}
            </p>
            <p className="mt-2 font-mono text-[12px] uppercase text-text-secondary" style={{ letterSpacing: "0.04em" }}>
              brand systems for the AI era.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="space-y-2 text-[14px]">
              <li>
                <Link
                  href="/how-to-use"
                  className="text-text-secondary transition-opacity hover:text-[color:var(--color-accent-purple)] hover:opacity-100"
                >
                  How to use
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-text-secondary transition-opacity hover:text-[color:var(--color-accent-purple)]"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-text-secondary transition-opacity hover:text-[color:var(--color-accent-purple)]"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex flex-col items-start md:items-end gap-2">
            <PoweredBy />
            <a
              href="https://nineyards.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-text-attribution transition-opacity hover:opacity-100"
              style={{ letterSpacing: "0.02em" }}
            >
              nineyards.pt ↗
            </a>
          </div>
        </div>

        <div
          className="mt-10 border-t pt-6 text-[12px] text-text-attribution"
          style={{
            borderColor: "var(--color-border-subtle)",
            letterSpacing: "0.02em",
          }}
        >
          © {year} &gt; brand.soul OS · a nineyards product · Made in Portugal
        </div>
      </div>
    </footer>
  );
}
