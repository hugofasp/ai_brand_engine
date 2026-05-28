"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, FieldHelp } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type {
  MaterialsContext,
  UploadedFile,
} from "@/lib/supabase/types";
import type { MaterialsStreamEvent } from "@/app/api/materials/stream/route";

type Phase = "form" | "running" | "error";

type TimelineItem =
  | { kind: "page"; url: string; title: string }
  | { kind: "linkedin"; url: string }
  | { kind: "draft"; questionId: string; label: string; preview: string }
  | { kind: "note"; text: string };

type UploadStatus =
  | { kind: "idle" }
  | { kind: "uploading"; fileName: string }
  | {
      kind: "result";
      accepted: number;
      rejections: Array<{ name: string; reason: string }>;
    };

const MAX_UPLOADS = 5;
const MAX_FILE_MB = 25;
const ACCEPT_ATTR = ".pdf,.docx,.doc,.txt,.md";

/** Accept lazy URL input ("yourbrand.com", "www.yourbrand.com",
 * "yourbrand.com/about") and produce a proper https:// URL. Empty
 * input returns empty string. */
function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  // Already has a scheme — keep it.
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Protocol-relative (//...) → assume https.
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

export function MaterialsPage({
  requestId,
  initialContext,
}: {
  requestId: string;
  initialContext: MaterialsContext;
}) {
  const router = useRouter();
  const hasPriorRun = Boolean(initialContext.extracted_at);

  // Three stackable inputs. All optional. At least one must be non-empty
  // for the "Process" CTA to enable, but "Skip and start interview"
  // works regardless.
  const [url, setUrl] = useState(initialContext.url ?? "");
  const [pastedText, setPastedText] = useState(
    initialContext.pasted_text ?? "",
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    initialContext.uploaded_files ?? [],
  );
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    kind: "idle",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("form");
  const [errorState, setErrorState] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [stage, setStage] = useState<
    "crawling" | "extracting" | "persisting" | "done" | null
  >(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  /* ---------------- uploads ---------------- */

  async function handleFilesPicked(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (uploadedFiles.length + files.length > MAX_UPLOADS) {
      setUploadStatus({
        kind: "result",
        accepted: 0,
        rejections: [
          {
            name: "(batch)",
            reason: `Limit is ${MAX_UPLOADS} files per interview. You already have ${uploadedFiles.length}.`,
          },
        ],
      });
      return;
    }

    setUploadStatus({ kind: "uploading", fileName: files[0].name });
    const fd = new FormData();
    fd.append("requestId", requestId);
    for (const f of Array.from(files)) fd.append("file", f);

    try {
      const res = await fetch("/api/materials/upload", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            accepted?: Array<{
              id: string;
              name: string;
              bytes: number;
              mime: string;
              extracted_chars: number;
              extraction_empty: boolean;
            }>;
            rejections?: Array<{ name: string; reason: string }>;
          }
        | null;
      if (!res.ok || !data?.ok) {
        setUploadStatus({
          kind: "result",
          accepted: 0,
          rejections: [
            {
              name: "(upload)",
              reason: data?.error ?? `HTTP ${res.status}`,
            },
          ],
        });
        return;
      }
      // Merge the new files into local state. The server is the source
      // of truth; we re-fetch the full list on the next page load.
      const newFiles: UploadedFile[] = (data.accepted ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        mime: a.mime,
        bytes: a.bytes,
        storage_path: "",
        uploaded_at: new Date().toISOString(),
        extracted_chars: a.extracted_chars,
        extraction_empty: a.extraction_empty,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setUploadStatus({
        kind: "result",
        accepted: newFiles.length,
        rejections: data.rejections ?? [],
      });
    } catch (err) {
      setUploadStatus({
        kind: "result",
        accepted: 0,
        rejections: [
          {
            name: "(upload)",
            reason: err instanceof Error ? err.message : String(err),
          },
        ],
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  /* ---------------- extraction stream ---------------- */

  const hasAnySource =
    Boolean(url.trim()) ||
    Boolean(pastedText.trim()) ||
    uploadedFiles.length > 0;

  async function handleProcess() {
    if (!hasAnySource) return;
    setPhase("running");
    setErrorState(null);
    setTimeline([]);
    setStage(url.trim() ? "crawling" : "extracting");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/materials/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          url: normalizeUrl(url) || undefined,
          pasted_text: pastedText.trim() || undefined,
          include_uploads: uploadedFiles.length > 0,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalRedirect: string | null = null;
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
          let event: MaterialsStreamEvent;
          try {
            event = JSON.parse(dataLine.slice(6)) as MaterialsStreamEvent;
          } catch {
            continue;
          }
          switch (event.type) {
            case "started":
              setTimeline((t) => [
                ...t,
                {
                  kind: "note",
                  text: summariseSources(event.sources),
                },
              ]);
              break;
            case "crawl-entry":
            case "crawl-page":
              setTimeline((t) => [
                ...t,
                { kind: "page", url: event.url, title: event.title },
              ]);
              break;
            case "crawl-skipped":
              break;
            case "linkedin-found":
              setTimeline((t) => [
                ...t,
                { kind: "linkedin", url: event.url },
              ]);
              break;
            case "crawl-done":
              setTimeline((t) => [
                ...t,
                {
                  kind: "note",
                  text: `Read ${event.pageCount} page${event.pageCount === 1 ? "" : "s"}.`,
                },
              ]);
              break;
            case "uploads-included":
              setTimeline((t) => [
                ...t,
                {
                  kind: "note",
                  text: `Including ${event.count} uploaded file${event.count === 1 ? "" : "s"} (${event.total_chars.toLocaleString()} chars).`,
                },
              ]);
              break;
            case "extract-started":
              setStage("extracting");
              setTimeline((t) => [
                ...t,
                { kind: "note", text: "Sending to Claude for drafts." },
              ]);
              break;
            case "draft-ready":
              setTimeline((t) => [
                ...t,
                {
                  kind: "draft",
                  questionId: event.questionId,
                  label: event.label,
                  preview: event.preview,
                },
              ]);
              break;
            case "extract-done":
              setTimeline((t) => [
                ...t,
                {
                  kind: "note",
                  text: `${event.succeededCount} draft${event.succeededCount === 1 ? "" : "s"} ready. Saving.`,
                },
              ]);
              setStage("persisting");
              break;
            case "persisted":
              setStage("done");
              break;
            case "final":
              finalRedirect = event.redirectTo;
              break streamLoop;
            case "error":
              throw new Error(event.message);
          }
        }
      }

      if (finalRedirect) {
        await new Promise((r) => setTimeout(r, 350));
        router.push(finalRedirect);
        return;
      }
      throw new Error("Pipeline ended without finalizing.");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      // Diagnostic: log the failure so we can tell whether extraction
      // crashed, supabase write failed, or the stream ended without a
      // `final` event. Without this, the user sees the form again with
      // a tiny error banner and has no idea what tripped.
      console.error("[materials] processing failed", err);
      setPhase("error");
      setErrorState(err instanceof Error ? err.message : String(err));
    } finally {
      abortRef.current = null;
    }
  }

  function handleRetry() {
    setPhase("form");
    setErrorState(null);
    setTimeline([]);
    setStage(null);
  }

  function handleSkip() {
    router.push(`/interview/${requestId}/chat`);
  }

  /* ---------------- render ---------------- */

  if (phase === "running") {
    return (
      <RunningScreen
        timeline={timeline}
        stage={stage}
        sourceSummary={summariseFromState({
          url,
          pastedText,
          uploadCount: uploadedFiles.length,
        })}
      />
    );
  }

  if (phase === "error") {
    return (
      <ErrorScreen
        reason={errorState ?? "Something blocked the pipeline."}
        timeline={timeline}
        onRetry={handleRetry}
        onSkip={handleSkip}
      />
    );
  }

  return (
    <section className="mx-auto max-w-[680px] px-6 py-16">
      <p
        className="text-center text-[12px] uppercase text-text-secondary"
        style={{ letterSpacing: "0.02em" }}
      >
        Phase 0 · Optional
      </p>
      <h1
        className="mt-4 text-center font-serif text-[40px] leading-[1.15]"
        style={{ letterSpacing: "-0.015em" }}
      >
        Bring your context
      </h1>
      <p className="mx-auto mt-4 max-w-[560px] text-center text-[16px] text-text-secondary">
        Drop in anything that helps us draft starting points: your website,
        copy that you have at hand, files from a deck. Use one. Use all
        three. Skip entirely if you&apos;d rather start cold. The interview
        works either way.
      </p>

      <div className="mt-10 space-y-6">
        {/* URL */}
        <SourceBlock
          label="Website"
          help="We&rsquo;ll read your homepage and a few high-signal pages. Just the domain is enough. yourbrand.com works."
        >
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={(e) => {
              // Normalize on blur so the user sees the final URL form
              // before submitting (and so the value matches what we'll
              // actually send).
              const next = normalizeUrl(e.target.value);
              if (next !== e.target.value) setUrl(next);
            }}
            placeholder="yourbrand.com"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </SourceBlock>

        {/* Paste */}
        <SourceBlock
          label="Copy / paste"
          help="Pitch deck text, About page, internal manifesto. Plain text works best."
        >
          <Textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your context here. No site yet? Drop the copy you imagine for it."
            rows={6}
          />
        </SourceBlock>

        {/* Uploads */}
        <SourceBlock
          label="Files"
          help={`Up to ${MAX_UPLOADS} files. PDF, DOCX, TXT, MD. Max ${MAX_FILE_MB} MB each.`}
        >
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT_ATTR}
              onChange={(e) => handleFilesPicked(e.target.files)}
              disabled={
                uploadStatus.kind === "uploading" ||
                uploadedFiles.length >= MAX_UPLOADS
              }
              className="block w-full text-[14px] text-text-secondary file:mr-3 file:rounded-md file:border file:border-border-strong file:bg-bg-tertiary file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-text-primary file:hover:bg-bg-secondary disabled:opacity-50"
            />
            {uploadStatus.kind === "uploading" ? (
              <p className="text-[12px] text-text-muted">
                Uploading {uploadStatus.fileName}…
              </p>
            ) : null}
            {uploadStatus.kind === "result" &&
            uploadStatus.rejections.length > 0 ? (
              <ul className="space-y-1 text-[12px] text-text-primary">
                {uploadStatus.rejections.map((r, i) => (
                  <li key={i}>
                    <span className="text-text-muted">{r.name}:</span>{" "}
                    {r.reason}
                  </li>
                ))}
              </ul>
            ) : null}

            {uploadedFiles.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {uploadedFiles.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-baseline justify-between rounded-md border bg-bg-tertiary px-3 py-1.5 text-[13px]"
                    style={{ borderColor: "var(--color-border-subtle)" }}
                  >
                    <span className="text-text-primary">{f.name}</span>
                    <span className="text-[11px] text-text-muted">
                      {prettyBytes(f.bytes)}
                      {f.extraction_empty
                        ? " · no text extracted"
                        : ` · ${f.extracted_chars.toLocaleString()} chars`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </SourceBlock>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Button
          type="button"
          onClick={handleProcess}
          disabled={!hasAnySource || uploadStatus.kind === "uploading"}
          size="lg"
          className="px-8"
        >
          {hasPriorRun ? "Re-process my context" : "Use this context"}
        </Button>
        <button
          type="button"
          onClick={handleSkip}
          className="text-[14px] text-text-muted underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
        >
          Skip and start the interview without any context
        </button>
      </div>

      {errorState ? (
        <div
          role="alert"
          className="mx-auto mt-6 flex max-w-[520px] items-start gap-2 rounded-md border bg-bg-secondary p-3 text-[14px]"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <AlertTriangle
            size={14}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0 text-text-primary"
          />
          <span className="text-text-secondary">{errorState}</span>
        </div>
      ) : null}

      {hasPriorRun && phase === "form" ? (
        <p className="mt-10 text-center text-[12px] text-text-muted">
          You drafted context on{" "}
          {new Date(initialContext.extracted_at!).toLocaleString()}.
          Re-processing replaces the existing drafts.
        </p>
      ) : null}
    </section>
  );
}

function SourceBlock({
  label,
  help,
  children,
}: {
  label: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-md border bg-bg-secondary p-4"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <p
        className="text-[12px] uppercase text-text-secondary"
        style={{ letterSpacing: "0.04em" }}
      >
        {label}
      </p>
      <div className="mt-3">{children}</div>
      <FieldHelp>{help}</FieldHelp>
    </div>
  );
}

/**
 * Shown when the extraction pipeline errors out. Replaces the silent
 * "fall back to the form with a tiny banner" behaviour that made it
 * look like the user had been bounced back for no reason.
 */
function ErrorScreen({
  reason,
  timeline,
  onRetry,
  onSkip,
}: {
  reason: string;
  timeline: TimelineItem[];
  onRetry: () => void;
  onSkip: () => void;
}) {
  return (
    <section className="mx-auto max-w-[680px] px-6 py-16">
      <p
        className="text-center text-[12px] uppercase text-text-secondary"
        style={{ letterSpacing: "0.02em" }}
      >
        Phase 0 · We hit a snag
      </p>
      <h1
        className="mt-4 text-center font-serif text-[32px] leading-[1.2]"
        style={{ letterSpacing: "-0.015em" }}
      >
        Processing stopped before we finished.
      </h1>
      <p className="mx-auto mt-4 max-w-[560px] text-center text-[14px] text-text-secondary">
        Your context is still saved on the form below. Pick an option and
        try again, or skip the materials step entirely.
      </p>

      <div
        role="alert"
        className="mx-auto mt-8 flex max-w-[560px] items-start gap-2 rounded-md border bg-bg-secondary p-4 text-[13px]"
        style={{ borderColor: "var(--color-border-emphasis)" }}
      >
        <AlertTriangle
          size={14}
          strokeWidth={1.5}
          className="mt-0.5 shrink-0 text-text-primary"
        />
        <div className="min-w-0 flex-1">
          <p className="text-text-primary">What happened</p>
          <p className="mt-1 text-text-secondary">{reason}</p>
        </div>
      </div>

      {timeline.length > 0 ? (
        <details className="mx-auto mt-4 max-w-[560px]">
          <summary className="cursor-pointer text-[12px] text-text-muted hover:text-[color:var(--color-accent-purple)]">
            What we managed before it stopped ({timeline.length})
          </summary>
          <ol className="mt-3 space-y-1 text-[12px] text-text-muted">
            {timeline.map((t, i) => (
              <li key={i}>
                {t.kind === "page"
                  ? `Read ${t.url}`
                  : t.kind === "linkedin"
                    ? `Found LinkedIn: ${t.url}`
                    : t.kind === "draft"
                      ? `Drafted ${t.label}`
                      : t.kind === "note"
                        ? t.text
                        : ""}
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      <div className="mt-10 flex flex-col items-center gap-3">
        <Button type="button" onClick={onRetry} size="lg" className="px-8">
          Try again
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="text-[14px] text-text-muted underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
        >
          Skip and start the interview without context
        </button>
      </div>
    </section>
  );
}

function RunningScreen({
  timeline,
  stage,
  sourceSummary,
}: {
  timeline: TimelineItem[];
  stage: "crawling" | "extracting" | "persisting" | "done" | null;
  sourceSummary: string;
}) {
  const headline =
    stage === "persisting" || stage === "done"
      ? "Saving your drafts"
      : stage === "extracting"
        ? "Reading with Claude"
        : "Reading your context";

  return (
    <section className="mx-auto max-w-[680px] px-6 py-20">
      <p
        className="text-[12px] uppercase text-text-secondary"
        style={{ letterSpacing: "0.02em" }}
      >
        Phase 0
      </p>
      <h1
        className="mt-4 font-serif text-[32px] leading-[1.15]"
        style={{ letterSpacing: "-0.015em" }}
      >
        {headline}
      </h1>
      <p className="mt-3 text-[14px] text-text-secondary">{sourceSummary}</p>

      <ol role="status" aria-live="polite" className="mt-10 space-y-3">
        {timeline.length === 0 ? (
          <li className="flex items-center gap-3 text-[14px] text-text-muted">
            <Spinner /> Connecting.
          </li>
        ) : null}
        {timeline.map((item, i) => (
          <TimelineRow key={i} item={item} />
        ))}
        {stage === "extracting" &&
        !timeline.some((t) => t.kind === "draft") ? (
          <li className="flex items-center gap-3 text-[14px] text-text-muted">
            <Spinner /> Drafting answers (usually 20-40 seconds).
          </li>
        ) : null}
        {stage === "persisting" ? (
          <li className="flex items-center gap-3 text-[14px] text-text-muted">
            <Spinner /> Saving.
          </li>
        ) : null}
      </ol>

      <p className="mt-12 text-[12px] text-text-muted">
        We&apos;ll send you straight to the interview when ready.
      </p>
    </section>
  );
}

function TimelineRow({ item }: { item: TimelineItem }) {
  if (item.kind === "page") {
    return (
      <li className="flex items-baseline gap-3 text-[14px] text-text-secondary">
        <Tick />
        <span>
          Read{" "}
          <span className="text-text-primary">
            {item.title || prettyHost(item.url) || item.url}
          </span>
          <span className="ml-2 text-[12px] text-text-muted">
            {pathOf(item.url)}
          </span>
        </span>
      </li>
    );
  }
  if (item.kind === "linkedin") {
    return (
      <li className="flex items-baseline gap-3 text-[14px] text-text-secondary">
        <Tick />
        <span>
          Found LinkedIn link{" "}
          <span className="text-[12px] text-text-muted">{item.url}</span>
        </span>
      </li>
    );
  }
  if (item.kind === "draft") {
    return (
      <li className="flex items-baseline gap-3 text-[14px] text-text-secondary">
        <Tick />
        <span>
          Draft for{" "}
          <span className="text-text-primary">{item.label}</span>
          {item.preview ? (
            <span className="ml-2 text-[12px] text-text-muted">
              &ldquo;{item.preview}&rdquo;
            </span>
          ) : null}
        </span>
      </li>
    );
  }
  return (
    <li className="flex items-baseline gap-3 text-[14px] text-text-secondary">
      <Tick />
      <span>{item.text}</span>
    </li>
  );
}

function Tick() {
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
      className="inline-block h-3 w-3 animate-pulse rounded-full bg-text-secondary"
    />
  );
}

function prettyHost(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return rawUrl;
  }
}

function pathOf(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    return u.pathname + (u.search || "");
  } catch {
    return "";
  }
}

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function summariseSources(s: {
  website: boolean;
  paste: boolean;
  uploads: number;
}): string {
  const parts: string[] = [];
  if (s.website) parts.push("the website");
  if (s.paste) parts.push("your pasted text");
  if (s.uploads > 0)
    parts.push(`${s.uploads} uploaded file${s.uploads === 1 ? "" : "s"}`);
  if (parts.length === 0) return "Starting cold.";
  return `Sources: ${parts.join(" + ")}.`;
}

function summariseFromState(input: {
  url: string;
  pastedText: string;
  uploadCount: number;
}): string {
  const parts: string[] = [];
  if (input.url.trim()) parts.push("crawling your website");
  if (input.pastedText.trim()) parts.push("reading your pasted text");
  if (input.uploadCount > 0)
    parts.push(
      `including ${input.uploadCount} uploaded file${input.uploadCount === 1 ? "" : "s"}`,
    );
  if (parts.length === 0) return "Live feed.";
  return parts.join(" + ") + ".";
}

// Re-export for older imports.
export type RunResult = never;
