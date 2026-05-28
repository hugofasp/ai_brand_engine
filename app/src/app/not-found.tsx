import Link from "next/link";

// Copy verbatim from NINEYARDS_STATIC_PAGES.md — "404 page".
export default function NotFound() {
  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-[560px] text-center">
        <h1
          className="font-serif lowercase text-[48px] leading-[1.15]"
          style={{ letterSpacing: "-0.015em" }}
        >
          Lost the thread.
        </h1>
        <p className="mt-6 text-[18px] text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist. Maybe try one of
          these:
        </p>
        <ul className="mt-8 space-y-2 text-[16px]">
          <li>
            <Link
              href="/"
              className="text-text-primary underline underline-offset-4"
            >
              Home →
            </Link>
          </li>
          <li>
            <Link
              href="/how-to-use"
              className="text-text-primary underline underline-offset-4"
            >
              How to use →
            </Link>
          </li>
          <li>
            <Link
              href="/contact"
              className="text-text-primary underline underline-offset-4"
            >
              Contact →
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
