"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { GenerationEvent } from "@/lib/generation/generate";

/**
 * "Generate > brand.soul OS" runs the pack generation via SSE so the
 * admin sees each file land live. Claude-synthesized files announce
 * themselves with a specific status ("Writing BRAND CORE in your
 * voice…") so the wait feels intentional rather than opaque.
 *
 * Two variants:
 *   `full`    — large primary CTA + per-file timeline (detail page)
 *   `compact` — pill button + lightweight counter (list row)
 */

type TimelineEntry =
  | { kind: "started"; total: number }
  | {
      kind: "file";
      name: string;
      mode: "template" | "claude";
      status: "running" | "done";
      size?: number;
    }
  | { kind: "persisting" }
  | { kind: "final"; count: number }
  | { kind: "error"; message: string };

const PHASE_LABELS: Record<string, string> = {
  "0_README.txt": "Writing the README",
  "0_USAGE_GUIDE.txt": "Composing the LLM usage guide",
  "10_BRAND_CORE.txt": "Writing BRAND CORE in the brand's voice",
  "11_AUDIENCE.txt": "Writing AUDIENCE in the brand's voice",
  "12_PILLARS.txt": "Writing PILLARS in the brand's voice",
  "20_VOICE_CORE.txt": "Compiling universal voice rules",
};

function statusLabelFor(name: string, mode: "template" | "claude"): string {
  if (PHASE_LABELS[name]) return PHASE_LABELS[name];
  if (name.startsWith("21_VOICE_FLEX_")) {
    return mode === "claude"
      ? "Writing register samples + sensitive playbook"
      : "Compiling register samples + sensitive playbook";
  }
  if (name.startsWith("22_LEXICON_")) return "Compiling lexicon";
  if (name.startsWith("30_CHANNEL_SPECS_")) return "Compiling channel rules";
  if (name.startsWith("31_EXAMPLES_LIBRARY_")) return "Compiling examples library";
  return mode === "claude" ? `Writing ${name}` : `Rendering ${name}`;
}

export function GenerateBrandEngineCta({
  requestId,
  variant = "full",
}: {
  requestId: string;
  variant?: "full" | "compact";
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function run() {
    if (running) return;
    setRunning(true);
    setError(null);
    setTimeline([]);
    setDoneCount(0);
    setTotalCount(0);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      streamLoop: while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sepIdx: number;
        while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
          const record = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);
          const dataLine = record
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          let event: GenerationEvent;
          try {
            event = JSON.parse(dataLine.slice(6)) as GenerationEvent;
          } catch {
            continue;
          }
          switch (event.type) {
            case "started":
              setTotalCount(event.totalFiles);
              setTimeline((t) => [
                ...t,
                { kind: "started", total: event.totalFiles },
              ]);
              break;
            case "file-started":
              setTimeline((t) => [
                ...t,
                {
                  kind: "file",
                  name: event.name,
                  mode: event.mode,
                  status: "running",
                },
              ]);
              break;
            case "file-done":
              setDoneCount((c) => c + 1);
              setTimeline((t) =>
                t.map((entry) =>
                  entry.kind === "file" &&
                  entry.name === event.name &&
                  entry.status === "running"
                    ? { ...entry, status: "done", size: event.size }
                    : entry,
                ),
              );
              break;
            case "persisting":
              setTimeline((t) => [...t, { kind: "persisting" }]);
              break;
            case "final":
              setTimeline((t) => [
                ...t,
                { kind: "final", count: event.fileCount },
              ]);
              break streamLoop;
            case "error":
              throw new Error(event.message);
          }
        }
      }
      // Soft pause so the user reads the "done" beat before nav refresh.
      await new Promise((r) => setTimeout(r, 350));
      router.refresh();
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  if (variant === "compact") {
    return (
      <div className="inline-flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="inline-flex items-center justify-center rounded-md bg-cta-bg px-3 py-1.5 text-[12px] font-medium text-cta-text transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] active:bg-[color:var(--color-accent-purple-strong)] disabled:opacity-50"
        >
          {running
            ? totalCount
              ? `Generating ${doneCount}/${totalCount}…`
              : "Generating…"
            : "Generate"}
        </button>
        {error ? (
          <span className="text-[11px] text-text-primary">{error}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-[14px] font-medium transition-colors duration-150 hover:bg-[color:var(--color-accent-purple-strong)] active:bg-[color:var(--color-accent-purple-strong)] disabled:opacity-50"
        style={{
          background: "var(--color-accent-purple)",
          color: "var(--color-bg-secondary)",
        }}
      >
        {running
          ? totalCount
            ? `Generating ${doneCount}/${totalCount}…`
            : "Generating…"
          : "Generate > brand.soul OS"}
      </button>

      {error ? (
        <p className="mt-3 text-[13px] text-text-primary" role="alert">
          {error}
        </p>
      ) : null}

      {timeline.length > 0 ? (
        <ol
          className="mt-4 max-w-[560px] space-y-2"
          role="status"
          aria-live="polite"
        >
          {timeline.map((entry, i) => (
            <TimelineRow key={i} entry={entry} />
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function TimelineRow({ entry }: { entry: TimelineEntry }) {
  if (entry.kind === "started") {
    return (
      <li className="flex items-baseline gap-2 text-[13px] text-text-muted">
        <Bullet />
        <span>
          Starting. {entry.total} file{entry.total === 1 ? "" : "s"} to produce.
        </span>
      </li>
    );
  }
  if (entry.kind === "file") {
    const isRunning = entry.status === "running";
    return (
      <li className="flex items-baseline gap-2 text-[13px]">
        {isRunning ? (
          <Spinner />
        ) : (
          <span
            aria-hidden="true"
            className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-text-primary"
          />
        )}
        <span className={isRunning ? "text-text-secondary" : "text-text-primary"}>
          {statusLabelFor(entry.name, entry.mode)}
          {entry.size ? (
            <span className="ml-2 text-[11px] text-text-muted">
              {entry.size.toLocaleString()} bytes
            </span>
          ) : null}
          {entry.mode === "claude" ? (
            <span className="ml-2 text-[11px] uppercase text-text-muted">
              · claude
            </span>
          ) : null}
        </span>
      </li>
    );
  }
  if (entry.kind === "persisting") {
    return (
      <li className="flex items-baseline gap-2 text-[13px] text-text-muted">
        <Spinner /> Saving to database…
      </li>
    );
  }
  if (entry.kind === "final") {
    return (
      <li className="flex items-baseline gap-2 text-[13px] text-text-primary">
        <Bullet />
        <span>
          Done. {entry.count} file{entry.count === 1 ? "" : "s"} ready below.
        </span>
      </li>
    );
  }
  return (
    <li className="flex items-baseline gap-2 text-[13px] text-text-primary">
      <Bullet />
      <span>{entry.message}</span>
    </li>
  );
}

function Bullet() {
  return (
    <span
      aria-hidden="true"
      className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-text-secondary"
    />
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="mt-1.5 inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-text-secondary"
    />
  );
}
