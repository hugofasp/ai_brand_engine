"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

/**
 * The /choose screen renders three "apps" in the brand.soul OS launcher.
 *
 * Visual register: app tile (icon + label + description + action button),
 * not a generic card. Each app has its own CTA so the affordance is clear
 * even on the disabled (coming soon) ones. The active app routes into the
 * interview; the coming-soon apps surface a toast asking to be notified.
 */
export function ChooseCards({ requestId }: { requestId: string | null }) {
  const [toast, setToast] = useState<string | null>(null);

  // Brand Identity card target: requires a request id from /start.
  const brandIdentityHref = requestId
    ? `/interview/${requestId}?product=brand-identity`
    : "/start";

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* App 1: Brand Identity (active, BETA) */}
        <AppTile
          status="beta"
          icon={<DocumentIcon />}
          title="Brand Identity for LLMs"
          description="A complete brand DNA file pack that teaches Claude, ChatGPT, or any LLM to produce content, reason, and evaluate proposals in your brand's voice. Interview-driven setup. Native multi-locale support."
          meta="~20-40 min · 12 files delivered"
          cta={
            <Link
              href={brandIdentityHref}
              aria-label="Start the Brand Identity for LLMs interview"
              className="inline-flex w-full items-center justify-center rounded-md bg-cta-bg px-5 py-2.5 text-[14px] font-medium text-cta-text transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] active:bg-[color:var(--color-accent-purple-strong)]"
            >
              Launch →
            </Link>
          }
        />

        {/* App 2: Design Brand Book (coming soon) */}
        <AppTile
          status="coming-soon"
          icon={<PaletteIcon />}
          title="Design Brand Book for AI"
          description="Visual identity, design tokens, and asset rules for AI design tools. Same interview-driven approach, applied to your visual system."
          cta={
            <button
              type="button"
              onClick={() =>
                setToast(
                  "This app isn't available yet. Want to be notified when it ships? Drop us a line at info@nineyards.pt.",
                )
              }
              className="inline-flex w-full items-center justify-center rounded-md border bg-transparent px-5 py-2.5 text-[14px] font-medium text-text-primary transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] hover:text-cta-text hover:border-transparent active:bg-[color:var(--color-accent-purple-strong)]"
              style={{ borderColor: "var(--color-border-emphasis)" }}
            >
              Notify me
            </button>
          }
        />

        {/* App 3: llms.txt (coming soon) */}
        <AppTile
          status="coming-soon"
          icon={<LlmsTxtIcon />}
          title="llms.txt for your site"
          description="Like robots.txt, but for AI-powered search engines (ChatGPT, Claude, Gemini, Perplexity). A standard llms.txt file that lets AI crawlers discover your site with fewer tokens and richer context. Generated from your brand pack so the structure stays on-message."
          cta={
            <button
              type="button"
              onClick={() =>
                setToast(
                  "llms.txt is on the roadmap. Want to be first to ship it? Drop us a line at info@nineyards.pt.",
                )
              }
              className="inline-flex w-full items-center justify-center rounded-md border bg-transparent px-5 py-2.5 text-[14px] font-medium text-text-primary transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] hover:text-cta-text hover:border-transparent active:bg-[color:var(--color-accent-purple-strong)]"
              style={{ borderColor: "var(--color-border-emphasis)" }}
            >
              Notify me
            </button>
          }
        />
      </div>

      <div role="status" aria-live="polite" className="mt-6 min-h-[1.5rem]">
        {toast ? (
          <p className="text-[14px] text-text-secondary">{toast}</p>
        ) : null}
      </div>
    </>
  );
}

/**
 * AppTile: a single launcher tile. The CTA is always visible at the
 * bottom so each app has an explicit action affordance, regardless of
 * status. Coming-soon tiles dim the icon + body copy but keep the CTA
 * crisp (the action is "get notified", which IS available).
 */
function AppTile({
  status,
  icon,
  title,
  description,
  meta,
  cta,
}: {
  status: "beta" | "coming-soon";
  icon: React.ReactNode;
  title: string;
  description: string;
  meta?: string;
  cta: React.ReactNode;
}) {
  const isActive = status === "beta";

  return (
    <Card
      className="group/tile relative flex h-full flex-col overflow-hidden p-7 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_14px_36px_-14px_rgba(139,92,246,0.45)] hover:border-[color:var(--color-accent-purple)]"
    >
      {/* Top accent strip. Active app shows it in black at rest; on hover
          (any colour) it switches to brand purple. Coming-soon tiles get
          a transparent strip at rest that paints purple on hover, so the
          accent lights up consistently across all three tiles. */}
      <div
        aria-hidden="true"
        className={
          isActive
            ? "absolute inset-x-0 top-0 h-1.5 bg-cta-bg transition-colors duration-150 group-hover/tile:bg-[color:var(--color-accent-purple)]"
            : "absolute inset-x-0 top-0 h-1.5 bg-transparent transition-colors duration-150 group-hover/tile:bg-[color:var(--color-accent-purple)]"
        }
      />

      <div className="flex flex-1 flex-col pt-3">
        {/* App icon tile + status badge */}
        <div className="flex items-start justify-between">
          <div
            aria-hidden="true"
            className={
              isActive
                ? "flex h-14 w-14 items-center justify-center rounded-md bg-cta-bg text-cta-text transition-colors duration-150 group-hover/tile:bg-[color:var(--color-accent-purple)]"
                : "flex h-14 w-14 items-center justify-center rounded-md bg-bg-tertiary text-text-secondary transition-colors duration-150 group-hover/tile:bg-[color:var(--color-accent-purple)] group-hover/tile:text-cta-text"
            }
          >
            {icon}
          </div>
          {isActive ? (
            <span
              className="rounded-sm bg-cta-bg px-2 py-1 text-[11px] font-medium uppercase text-cta-text transition-colors duration-150 group-hover/tile:bg-[color:var(--color-accent-purple)]"
              style={{ letterSpacing: "0.06em" }}
            >
              BETA
            </span>
          ) : (
            <span
              className="rounded-sm border border-border-strong px-2 py-1 text-[11px] font-medium uppercase text-text-secondary transition-colors duration-150 group-hover/tile:border-[color:var(--color-accent-purple)] group-hover/tile:text-[color:var(--color-accent-purple)]"
              style={{ letterSpacing: "0.06em" }}
            >
              COMING SOON
            </span>
          )}
        </div>

        {/* Title + description */}
        <h2
          className="mt-6 font-serif text-[22px] leading-[1.3]"
          style={{
            letterSpacing: "-0.005em",
            opacity: isActive ? 1 : 0.6,
          }}
        >
          {title}
        </h2>
        <p
          className="mt-3 text-[15px] text-text-secondary"
          style={{ opacity: isActive ? 1 : 0.7 }}
        >
          {description}
        </p>

        {meta ? (
          <p
            className="mt-6 text-[12px] uppercase text-text-attribution transition-colors duration-150 group-hover/tile:text-[color:var(--color-accent-purple)]"
            style={{ letterSpacing: "0.04em" }}
          >
            {meta}
          </p>
        ) : null}
      </div>

      {/* CTA: always visible at the bottom of the tile */}
      <div className="mt-6">{cta}</div>
    </Card>
  );
}

function DocumentIcon() {
  return (
    <svg
      aria-hidden="true"
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
      <path d="M9 9h2" />
    </svg>
  );
}

function LlmsTxtIcon() {
  return (
    <svg
      aria-hidden="true"
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      {/* > _ terminal prompt glyph inside the file */}
      <path d="M8 14l-2 2 2 2" />
      <path d="M13 19h3" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg
      aria-hidden="true"
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="7.5" cy="10.5" r="1" />
      <circle cx="12" cy="7.5" r="1" />
      <circle cx="16.5" cy="10.5" r="1" />
      <circle cx="14.5" cy="15.5" r="1" />
    </svg>
  );
}
