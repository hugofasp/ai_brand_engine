"use client";

import { useEffect } from "react";

/**
 * Canvas-driven blinking favicon.
 *
 * Synchronises the browser tab icon with the wordmark's
 * `terminal-prompt-blink` keyframe (1.1s cycle, 50% on / 50% off).
 * Works in every browser, including the ones that ignore animated GIF
 * favicons after the first frame.
 *
 * Implementation notes:
 *  - Removes any static `<link rel="icon">` on mount so we don't have
 *    two icon tags competing for the tab slot.
 *  - Adds one canvas-backed PNG link and rewrites its href every tick.
 *  - Pauses on `document.hidden` so background tabs don't burn CPU.
 *  - Respects `prefers-color-scheme`: dark tabs get a white chevron,
 *    light tabs get a near-black one. Updates live when the user
 *    switches their OS theme.
 *  - On unmount (route change, server rerender), restores cleanup.
 *
 * No-JS fallback: Next.js still emits the static `icon.svg` link tag
 * from `app/src/app/icon.svg`. This component overrides it on the
 * client only; users with JS disabled still see a non-blinking
 * chevron.
 */
export function BlinkingFavicon() {
  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let strokeColor = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "#ffffff"
      : "#0a0a0a";

    const drawFrame = (visible: boolean): string => {
      ctx.clearRect(0, 0, 64, 64);
      if (visible) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 11;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(16, 10);
        ctx.lineTo(50, 32);
        ctx.lineTo(16, 54);
        ctx.stroke();
      }
      return canvas.toDataURL("image/png");
    };

    // Strip any existing icon links so the browser doesn't render the
    // static SVG underneath our blinker. We keep apple-touch-icon (used
    // for iOS home-screen pinning, not the tab) alone.
    document
      .querySelectorAll<HTMLLinkElement>(
        'link[rel="icon"], link[rel="shortcut icon"]',
      )
      .forEach((l) => l.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);

    let on = true;
    const tick = () => {
      // Tab in background. Skip the work; the icon stays on whatever
      // state it was last left in, which doesn't matter since the user
      // can't see it.
      if (document.hidden) return;
      link.href = drawFrame(on);
      on = !on;
    };

    tick(); // initial paint so the first 550ms isn't empty
    const intervalId = window.setInterval(tick, 550);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onColorChange = (e: MediaQueryListEvent) => {
      strokeColor = e.matches ? "#ffffff" : "#0a0a0a";
    };
    mq.addEventListener("change", onColorChange);

    return () => {
      window.clearInterval(intervalId);
      mq.removeEventListener("change", onColorChange);
      link.remove();
    };
  }, []);

  return null;
}
