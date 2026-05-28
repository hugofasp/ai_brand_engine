"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Copy verbatim from NINEYARDS_STATIC_PAGES.md — "500 / Error page".
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO Phase 5: wire to error reporting once chosen.
    console.error(error);
  }, [error]);

  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-[560px] text-center">
        <h1
          className="font-serif lowercase text-[48px] leading-[1.15]"
          style={{ letterSpacing: "-0.015em" }}
        >
          Something broke.
        </h1>
        <p className="mt-6 text-[18px] text-text-secondary">
          This is on us. We&apos;ve been notified. Try again in a moment, or if
          it keeps happening, email info@nineyards.pt with what you were doing.
        </p>
        <div className="mt-10">
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </div>
    </section>
  );
}
