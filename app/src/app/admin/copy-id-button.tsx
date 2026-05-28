"use client";

import { useState } from "react";

/**
 * Compact "copy this request id" button for the admin list.
 * Shows the first 8 chars of the UUID as a chip; clicking copies the
 * full id to clipboard and flips the label to "Copied" briefly.
 */
export function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(id).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      },
      () => {
        // Clipboard blocked; fall back silently.
      },
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy full id (${id})`}
      className="inline-flex items-center gap-1 rounded-sm border bg-bg-tertiary px-1.5 py-0.5 font-mono text-[11px] text-text-secondary hover:bg-bg-secondary hover:text-[color:var(--color-accent-purple)]"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <span>{id.slice(0, 8)}</span>
      <span
        aria-hidden="true"
        className={
          copied ? "text-text-primary" : "text-text-muted"
        }
      >
        {copied ? "✓" : "⧉"}
      </span>
    </button>
  );
}
