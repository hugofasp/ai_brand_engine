"use client";

import { useState } from "react";

/**
 * Admin viewer for the generated `0_CUSTOM_INSTRUCTIONS.txt`.
 *
 * Surfaces the paste-ready block prominently so the operator can:
 *  - audit what was generated for the client
 *  - copy the block to clipboard in one click (useful for manual
 *    delivery / support / debugging)
 *  - verify the BEGIN / END markers are well-formed
 *
 * The full file content (including pre-marker explanation) is in
 * `fullContent`; we extract the paste-ready block for the primary
 * panel and expose the raw file under a collapsed `<details>`.
 */
export function CustomInstructionsPanel({
  fullContent,
}: {
  fullContent: string;
}) {
  const block = extractInstructionsBlock(fullContent);
  const [copied, setCopied] = useState<"block" | "full" | null>(null);

  function copy(text: string, which: "block" | "full") {
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopied(which);
        window.setTimeout(() => setCopied(null), 1500);
      },
      () => {
        // Clipboard blocked; fall through silently.
      },
    );
  }

  return (
    <section className="rounded-md border bg-bg-secondary p-5"
      style={{ borderColor: "var(--color-border-emphasis)" }}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2
            className="text-[12px] uppercase text-text-secondary"
            style={{ letterSpacing: "0.02em" }}
          >
            Custom instructions for the client&apos;s LLM
          </h2>
          <p className="mt-1 text-[12px] text-text-muted">
            This block is sent inline in the delivery email and is what
            the client pastes into the Project Instructions / Custom GPT
            Instructions / Gemini Gem Instructions field. It is NOT
            shipped in the zip (would dilute its authority if attached
            as project knowledge).
          </p>
        </div>
        <button
          type="button"
          onClick={() => copy(block, "block")}
          disabled={!block}
          className="inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1.5 text-[12px] font-medium text-text-primary hover:bg-bg-tertiary disabled:opacity-40"
          style={{ borderColor: "var(--color-border-emphasis)" }}
        >
          {copied === "block" ? "Copied ✓" : "Copy block"}
        </button>
      </div>

      {block ? (
        <pre
          className="mt-4 overflow-x-auto rounded-md border bg-bg-primary p-4 text-[12.5px] whitespace-pre-wrap leading-[1.55] text-text-primary"
          style={{
            borderColor: "var(--color-border-subtle)",
            maxHeight: 360,
          }}
        >
          {block}
        </pre>
      ) : (
        <p className="mt-4 text-[13px] text-text-muted italic">
          No custom instructions content found. Generate the pack first.
        </p>
      )}

      {fullContent ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-[12px] text-text-muted hover:text-[color:var(--color-accent-purple)]">
            View the full file (with pre-marker explanation)
          </summary>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => copy(fullContent, "full")}
              className="text-[11px] text-text-muted underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
            >
              {copied === "full" ? "Copied ✓" : "Copy full file"}
            </button>
          </div>
          <pre
            className="mt-2 overflow-x-auto rounded-md border bg-bg-primary p-3 text-[12px] whitespace-pre-wrap leading-[1.55] text-text-secondary"
            style={{
              borderColor: "var(--color-border-subtle)",
              maxHeight: 280,
            }}
          >
            {fullContent}
          </pre>
        </details>
      ) : null}
    </section>
  );
}

/** Pull the paste-ready block out of the file content. Mirrors the
 * extractor used by the email-sending pipeline; kept duplicated here
 * (client component) instead of importing from server-only code. */
function extractInstructionsBlock(content: string): string {
  if (!content) return "";
  const beginPatterns = [
    /─{2,}\s*BEGIN\s+CUSTOM\s+INSTRUCTIONS\s*─{2,}/i,
    /-{2,}\s*BEGIN\s+CUSTOM\s+INSTRUCTIONS\s*-{2,}/i,
    /=+\s*BEGIN\s+CUSTOM\s+INSTRUCTIONS\s*=+/i,
  ];
  const endPatterns = [
    /─{2,}\s*END\s+CUSTOM\s+INSTRUCTIONS\s*─{2,}/i,
    /-{2,}\s*END\s+CUSTOM\s+INSTRUCTIONS\s*-{2,}/i,
    /=+\s*END\s+CUSTOM\s+INSTRUCTIONS\s*=+/i,
  ];
  let beginIdx = -1;
  let beginLen = 0;
  for (const p of beginPatterns) {
    const m = content.match(p);
    if (m && m.index !== undefined) {
      beginIdx = m.index;
      beginLen = m[0].length;
      break;
    }
  }
  let endIdx = -1;
  for (const p of endPatterns) {
    const m = content.match(p);
    if (m && m.index !== undefined) {
      endIdx = m.index;
      break;
    }
  }
  if (beginIdx === -1 || endIdx === -1 || endIdx <= beginIdx) {
    return content.trim();
  }
  return content.slice(beginIdx + beginLen, endIdx).trim();
}
