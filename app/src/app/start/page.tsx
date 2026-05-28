import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { StartForm } from "./start-form";
import { HeroAtomBackground } from "@/app/hero-atom-background";

export const metadata: Metadata = {
  title: "Get started",
};

// Copy verbatim from NINEYARDS_STATIC_PAGES.md — "Page: Get Started".
export default function StartPage() {
  return (
    <section className="relative overflow-hidden px-6 py-20">
      <HeroAtomBackground />
      <div className="relative z-10 mx-auto max-w-[480px]">
        <header className="mb-10 text-center">
          <h1
            className="font-serif lowercase text-[28px] leading-[1.25]"
            style={{ letterSpacing: "-0.005em" }}
          >
            Let&apos;s start with the basics.
          </h1>
          <p className="mt-3 text-[14px] text-text-secondary">
            We need a few details before the interview begins. Takes 30 seconds.
          </p>
        </header>

        <Card>
          <StartForm />
        </Card>
      </div>
    </section>
  );
}
