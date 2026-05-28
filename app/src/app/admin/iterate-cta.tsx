"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GenerationEvent } from "@/lib/generation/generate";
import type { PackIteration } from "@/lib/supabase/types";

/**
 * "Iterate" — regenerate the brand pack with admin feedback baked into
 * the synthesis prompts. Same SSE pipeline as Generate, plus a
 * `feedback` string in the body.
 *
 * Two variants:
 *   compact — pill button in the list row that opens an inline overlay
 *   full    — full panel on the detail page with history + textarea
 */

type Variant = "compact" | "full";

type Progress = {
  total: number;
  done: number;
  current: string | null;
};

type Outcome =
  | { kind: "idle" }
  | { kind: "running"; progress: Progress }
  | { kind: "error"; message: string; lastFeedback: string }
  | { kind: "success"; fileCount: number; lastFeedback: string };

export function IteratePackCta({
  requestId,
  variant = "full",
  history = [],
  hasGeneratedFiles,
}: {
  requestId: string;
  variant?: Variant;
  history?: PackIteration[];
  hasGeneratedFiles: boolean;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [outcome, setOutcome] = useState<Outcome>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Auto-focus the textarea when arriving with #iterate in the URL
  // (typical entry from the admin list compact "Iterate" link).
  useEffect(() => {
    if (variant !== "full") return;
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#iterate") return;
    // Defer to next tick so the section is laid out before we focus.
    const id = window.setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 80);
    return () => window.clearTimeout(id);
  }, [variant]);

  const running = outcome.kind === "running";

  async function submit() {
    if (running || !feedback.trim()) return;
    const submittedFeedback = feedback;
    setOutcome({
      kind: "running",
      progress: { total: 0, done: 0, current: null },
    });

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, feedback: submittedFeedback }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalCount = 0;
      streamLoop: while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sepIdx: number;
        while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
          const record = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);
          const line = record.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          let event: GenerationEvent;
          try {
            event = JSON.parse(line.slice(6)) as GenerationEvent;
          } catch {
            continue;
          }
          switch (event.type) {
            case "started":
              setOutcome((o) =>
                o.kind === "running"
                  ? {
                      kind: "running",
                      progress: { ...o.progress, total: event.totalFiles },
                    }
                  : o,
              );
              break;
            case "file-started":
              setOutcome((o) =>
                o.kind === "running"
                  ? {
                      kind: "running",
                      progress: { ...o.progress, current: event.name },
                    }
                  : o,
              );
              break;
            case "file-done":
              setOutcome((o) =>
                o.kind === "running"
                  ? {
                      kind: "running",
                      progress: {
                        ...o.progress,
                        done: o.progress.done + 1,
                        current: null,
                      },
                    }
                  : o,
              );
              break;
            case "final":
              finalCount = event.fileCount;
              break streamLoop;
            case "error":
              throw new Error(event.message);
          }
        }
      }

      // Refresh server data quietly — component state survives, so the
      // success panel stays mounted with the persistent confirmation.
      router.refresh();
      setOutcome({
        kind: "success",
        fileCount: finalCount,
        lastFeedback: submittedFeedback,
      });
      setFeedback("");
    } catch (err) {
      setOutcome({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
        lastFeedback: submittedFeedback,
      });
    } finally {
      abortRef.current = null;
    }
  }

  function scrollToFiles() {
    const el = document.getElementById("generated-files");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function dismissOutcome() {
    setOutcome({ kind: "idle" });
  }

  /* ---------------- compact (list row) ----------------
   *
   * Writing prose feedback inside a table row is the wrong medium.
   * The compact button is purely navigational: it jumps to the detail
   * page with the iterate textarea focused. The detail page has the
   * proper writing surface (220px min-height, 10 rows, side-room).
   */

  if (variant === "compact") {
    const disabled = !hasGeneratedFiles;
    if (disabled) {
      return (
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1.5 text-[12px] font-medium text-text-primary opacity-40"
          style={{ borderColor: "var(--color-border-emphasis)" }}
          title="Generate the pack first, then you can iterate."
        >
          Iterate
        </button>
      );
    }
    return (
      <Link
        href={`/admin/${requestId}#iterate`}
        className="inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1.5 text-[12px] font-medium text-text-primary transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] hover:text-cta-text hover:border-transparent active:bg-[color:var(--color-accent-purple-strong)]"
        style={{ borderColor: "var(--color-border-emphasis)" }}
        title="Open the request and write iteration feedback"
      >
        Iterate
      </Link>
    );
  }

  /* ---------------- full (detail page) ---------------- */

  return (
    <div>
      <h2
        className="text-[12px] uppercase text-text-secondary"
        style={{ letterSpacing: "0.02em" }}
      >
        Iterate the pack
      </h2>
      <p className="mt-1 text-[12px] text-text-muted">
        Tell the system what to change. Your feedback is appended to each
        Claude-synthesis prompt and the pack regenerates. Brand rules
        (no em-dashes, no clichés, lexicon, voice) are enforced regardless
        of the feedback.
      </p>

      {!hasGeneratedFiles ? (
        <p className="mt-4 text-[13px] text-text-muted">
          Generate the pack first using the button at the top of this page.
          Then come back here to iterate.
        </p>
      ) : outcome.kind === "success" ? (
        <SuccessPanel
          fileCount={outcome.fileCount}
          lastFeedback={outcome.lastFeedback}
          requestId={requestId}
          onScrollToFiles={scrollToFiles}
          onIterateAgain={dismissOutcome}
        />
      ) : (
        <div className="mt-4 space-y-3">
          <textarea
            ref={textareaRef}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={`What should change? Be specific.

e.g. The PILLARS file is too long. Cut each pillar's mechanism paragraph by half.
e.g. The README opening paragraph feels generic. Make it sound like the brand actually wrote it.
e.g. Strengthen the audience copy: lead with stakes for the promotor-investidor segment.`}
            rows={10}
            disabled={running}
            className="w-full rounded-md border bg-bg-tertiary p-4 text-[14px] leading-[1.55] text-text-primary placeholder:text-text-muted disabled:opacity-50"
            style={{ borderColor: "var(--color-border-subtle)", minHeight: 220 }}
          />
          {running ? (
            <RunningProgress progress={outcome.progress} />
          ) : null}
          {outcome.kind === "error" ? (
            <div
              role="alert"
              className="rounded-md border bg-bg-secondary p-3 text-[13px]"
              style={{ borderColor: "var(--color-border-emphasis)" }}
            >
              <p className="text-text-primary">
                That iteration didn&apos;t finish.
              </p>
              <p className="mt-1 text-[12px] text-text-muted">
                Reason: {outcome.message}
              </p>
              <p className="mt-1 text-[12px] text-text-muted">
                Your feedback is still in the box. Adjust and try again.
              </p>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-text-muted">
              {feedback.trim().length} characters
            </p>
            <button
              type="button"
              onClick={submit}
              disabled={running || !feedback.trim()}
              className="inline-flex items-center justify-center rounded-md bg-cta-bg px-5 py-2.5 text-[14px] font-medium text-cta-text transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] active:bg-[color:var(--color-accent-purple-strong)] disabled:opacity-50"
            >
              {running ? "Iterating…" : "Apply feedback + regenerate"}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 ? (
        <div className="mt-8">
          <p
            className="text-[11px] uppercase text-text-muted"
            style={{ letterSpacing: "0.04em" }}
          >
            History ({history.length})
          </p>
          <ol className="mt-2 space-y-2">
            {[...history]
              .reverse()
              .slice(0, 10)
              .map((it, i) => (
                <li
                  key={`${it.at}-${i}`}
                  className="rounded-md border bg-bg-secondary p-3 text-[13px]"
                  style={{ borderColor: "var(--color-border-subtle)" }}
                >
                  <p className="text-[11px] text-text-muted">
                    {new Date(it.at).toLocaleString()} ·{" "}
                    {it.file_count} file{it.file_count === 1 ? "" : "s"}
                    {" · "}
                    {formatTokenCount(it.token_usage.output_tokens)} output
                    tokens
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-text-primary">
                    {it.prompt || (
                      <span className="italic text-text-muted">
                        (initial generation, no feedback)
                      </span>
                    )}
                  </p>
                </li>
              ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

function RunningProgress({ progress }: { progress: Progress }) {
  const pct = progress.total
    ? Math.round((progress.done / progress.total) * 100)
    : 0;
  return (
    <div
      className="rounded-md border bg-bg-secondary p-3 text-[13px]"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <p className="text-text-secondary">
        {progress.total
          ? `Regenerating ${progress.done} of ${progress.total} files (${pct}%).`
          : "Starting…"}
      </p>
      {progress.current ? (
        <p className="mt-1 text-[12px] text-text-muted">
          Current: {progress.current}
        </p>
      ) : null}
      <p className="mt-1 text-[12px] text-text-muted">
        This typically takes 30 to 60 seconds. Don&apos;t close this tab.
      </p>
    </div>
  );
}

function SuccessPanel({
  fileCount,
  lastFeedback,
  requestId,
  onScrollToFiles,
  onIterateAgain,
}: {
  fileCount: number;
  lastFeedback: string;
  requestId: string;
  onScrollToFiles: () => void;
  onIterateAgain: () => void;
}) {
  return (
    <div
      className="mt-4 rounded-md border bg-bg-secondary p-5"
      style={{ borderColor: "var(--color-border-emphasis)" }}
    >
      <p className="font-serif lowercase text-[18px] text-text-primary">
        Done. {fileCount} file{fileCount === 1 ? "" : "s"} regenerated.
      </p>
      <p className="mt-2 text-[13px] text-text-secondary">
        Your feedback was applied. The brand pack above has been replaced
        with the new versions. You don&apos;t need to hit Generate again.
      </p>

      <div className="mt-4 rounded-md border bg-bg-primary p-3 text-[12px]"
        style={{ borderColor: "var(--color-border-subtle)" }}>
        <p className="text-[11px] uppercase text-text-muted" style={{ letterSpacing: "0.04em" }}>
          Feedback applied
        </p>
        <p className="mt-1 whitespace-pre-wrap text-text-primary">
          {lastFeedback}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onScrollToFiles}
          className="inline-flex items-center justify-center rounded-md bg-cta-bg px-4 py-2 text-[13px] font-medium text-cta-text transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] active:bg-[color:var(--color-accent-purple-strong)]"
        >
          View updated files ↓
        </button>
        <a
          href={`/api/admin/download/${requestId}`}
          className="inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-2 text-[13px] text-text-primary transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] hover:text-cta-text hover:border-transparent active:bg-[color:var(--color-accent-purple-strong)]"
          style={{ borderColor: "var(--color-border-emphasis)" }}
        >
          Download new .zip
        </a>
        <button
          type="button"
          onClick={onIterateAgain}
          className="text-[13px] text-text-muted underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
        >
          Iterate again
        </button>
      </div>
    </div>
  );
}

function formatTokenCount(n: number): string {
  if (n < 1000) return n.toString();
  return `${(n / 1000).toFixed(1)}k`;
}
