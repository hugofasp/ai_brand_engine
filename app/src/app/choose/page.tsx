import type { Metadata } from "next";
import { getRequestIdFromCookie } from "@/app/actions/requests";
import { ChooseCards } from "./choose-cards";
import { HeroAtomBackground } from "@/app/hero-atom-background";

export const metadata: Metadata = {
  title: "Choose a product",
};

// Copy verbatim from NINEYARDS_STATIC_PAGES.md — "Page: Choose".
export default async function ChoosePage() {
  const requestId = await getRequestIdFromCookie();

  return (
    <section className="relative overflow-hidden px-6 py-20">
      <HeroAtomBackground />
      <div className="relative z-10 mx-auto max-w-[1100px]">
        <header className="mb-12 text-center">
          <h1
            className="font-serif lowercase text-[36px] leading-[1.2]"
            style={{ letterSpacing: "-0.01em" }}
          >
            What would you like to generate?
          </h1>
          <p className="mt-3 text-[14px] text-text-secondary">
            Pick a product to begin. You can come back later for the other one.
          </p>
        </header>

        <ChooseCards requestId={requestId} />
      </div>
    </section>
  );
}
