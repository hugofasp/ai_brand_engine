"use client";

import { useEffect, useState } from "react";

/**
 * Animated hero title: "One brand. One Voice. Every AI."
 *
 * Three coloured words anchor the headline:
 *   - brand   → accent-green   (the foundation that's already there)
 *   - Voice   → accent-orange  (the kinetic, expressive register)
 *   - AI      → accent-blue    (the digital surface) + word-swap
 *
 * The "AI" word cycles every ~2.5s through the LLMs the platform
 * supports, then back to "AI". Smooth opacity fade between values
 * so the line stays readable without distracting the eye away from
 * the rest of the headline.
 *
 * Width shift: the cycle words have different lengths (Claude=6,
 * ChatGPT=7, AI=2). We let the trailing period reflow naturally;
 * the eye expects punctuation to follow whatever word is showing.
 *
 * Accessibility: the animation is hidden from screen readers; an
 * aria-label on the wrapper announces the static headline.
 */

const CYCLE_WORDS = ["AI", "Claude", "ChatGPT", "Gemini", "Grok"] as const;
const CYCLE_MS = 2500;
const FADE_MS = 280;

export function AnimatedHeroTitle() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      // Fade out, swap word, fade back in.
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % CYCLE_WORDS.length);
        setVisible(true);
      }, FADE_MS);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, []);

  const word = CYCLE_WORDS[index];

  return (
    <h1
      className="lowercase font-semibold text-[48px] leading-[1.05] md:text-[80px]"
      style={{
        fontFamily: "var(--font-display)",
        letterSpacing: "-0.04em",
      }}
      aria-label="One business. One voice. Every AI."
    >
      <span style={{ whiteSpace: "nowrap" }}>
        one{" "}
        <span style={{ color: "var(--color-accent-green)" }}>business</span>.
      </span>{" "}
      <span style={{ whiteSpace: "nowrap" }}>
        one{" "}
        <span style={{ color: "var(--color-accent-orange)" }}>voice</span>.
      </span>{" "}
      <span style={{ whiteSpace: "nowrap" }}>
        every{" "}
        <span
          aria-hidden="true"
          className="inline-block"
          style={{
            color: "var(--color-accent-blue)",
            opacity: visible ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
            fontFeatureSettings: '"tnum"',
            willChange: "opacity",
          }}
        >
          {word.toLowerCase()}.
        </span>
      </span>
    </h1>
  );
}
