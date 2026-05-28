"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ChatBootstrap } from "@/app/actions/chat";
import type {
  ConversationMessage,
} from "@/lib/supabase/types";
import type { PresentChoicesPayload } from "@/lib/conversational/tools";
import type { TurnStreamEvent } from "@/lib/conversational/run-turn";
import { PHASE_NAMES, type Phase } from "@/interview/types";
import { cn } from "@/lib/cn";

/** Friendly Portuguese labels for the tool-started activity indicator. */
const TOOL_ACTIVITY_LABEL: Record<string, string> = {
  update_fields: "a registar a tua resposta",
  mark_phase_complete: "a fechar esta fase",
  flag_uncertain: "a marcar para revisitar",
};

type Msg = ConversationMessage;

/** Sentinel string the client sends to kick off the very first turn when
 * the conversation history is empty. We hide it from the rendered UI
 * (filtered in extractDisplayText). The server prompt is constructed so
 * Claude treats any "[BEGIN]" message as a cue to greet and start. */
const KICKOFF_SENTINEL = "[BEGIN]";

/**
 * Conversational interview UI. Two panes:
 *  - Left/center: the chat itself (message list + composer + A/B/C buttons)
 *  - Right: progress sidebar with filled fields per phase
 */
export function ChatClient({
  requestId,
  initial,
}: {
  requestId: string;
  initial: ChatBootstrap;
}) {
  const [messages, setMessages] = useState<Msg[]>(initial.messages);
  const [pendingChoices, setPendingChoices] = useState<PresentChoicesPayload | null>(
    initial.pendingChoices,
  );
  const [filledFields, setFilledFields] = useState<string[]>(initial.filledFields);
  const [completedPhases, setCompletedPhases] = useState<number[]>(
    initial.completedPhases,
  );
  const [input, setInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  /** When the previous turn failed mid-stream, we surface a banner with
   * a "Retry" button so the user can recover without losing context. */
  const [lastFailedAttempt, setLastFailedAttempt] = useState<{
    text: string;
    pickToolUseId?: string;
    displayLabel?: string;
  } | null>(null);

  // Restore any draft text the user had typed but hadn't sent before
  // they navigated away or the tab reloaded. Stored per request id so
  // multiple interviews don't collide. localStorage is client-only, so
  // we have to hydrate it AFTER mount — setState-in-effect is the
  // legitimate pattern here.
  const draftKey = `nineyards.chat.draft.${requestId}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved && !input) setInput(saved);
    } catch {
      // Storage disabled (private mode) — silent fallback.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the textarea content as the user types (debounced via the
  // browser's natural event coalescing — no explicit debounce needed
  // for typical typing rates).
  useEffect(() => {
    try {
      if (input) localStorage.setItem(draftKey, input);
      else localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
  }, [input, draftKey]);
  /** True while a streamed turn is in flight. */
  const [pending, setPending] = useState(false);
  /** Friendly label shown next to the thinking indicator when a tool fires
   * mid-turn (e.g., "a registar a tua resposta"). null when idle. */
  const [activityLabel, setActivityLabel] = useState<string | null>(null);
  /** Streaming-text buffer for the assistant turn currently being written.
   * When non-null, the message list shows this as a live bubble. */
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages / state changes.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, pending, pendingChoices, streamingText, activityLabel]);

  // Kick off the first turn automatically when the conversation is empty.
  const bootRanRef = useRef(false);
  useEffect(() => {
    if (bootRanRef.current) return;
    if (messages.length > 0) return;
    bootRanRef.current = true;
    runTurn({ text: KICKOFF_SENTINEL, pickToolUseId: undefined, displayInUI: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runTurn(opts: {
    text: string;
    pickToolUseId?: string;
    displayInUI: boolean;
    displayLabel?: string;
  }) {
    if (pending) return;
    setErrorMsg(null);
    setPending(true);
    setActivityLabel(null);
    setStreamingText("");

    const nowIso = new Date().toISOString();
    if (opts.displayInUI) {
      const display: Msg = {
        role: "user",
        at: nowIso,
        content: opts.displayLabel ?? opts.text,
      };
      setMessages((prev) => [...prev, display]);
    }
    // Clear pending choices immediately — we're responding to them.
    setPendingChoices(null);

    let accumulatedText = "";
    let finalAssistantContent: unknown[] | null = null;
    let finalPendingChoices: PresentChoicesPayload | null = null;

    try {
      const res = await fetch(`/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          userText: opts.text,
          pickToolUseId: opts.pickToolUseId,
        }),
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => res.statusText);
        throw new Error(errText || `HTTP ${res.status}`);
      }

      // Read the SSE stream. Server sends "data: <json>\n\n" per event.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      streamLoop: while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // Split on the SSE record separator.
        let sepIdx: number;
        while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
          const rawRecord = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);
          const dataLine = rawRecord
            .split("\n")
            .find((line) => line.startsWith("data: "));
          if (!dataLine) continue;
          let event: TurnStreamEvent;
          try {
            event = JSON.parse(dataLine.slice(6)) as TurnStreamEvent;
          } catch {
            continue;
          }
          switch (event.type) {
            case "text-delta":
              accumulatedText += event.delta;
              setStreamingText(accumulatedText);
              setActivityLabel(null);
              break;
            case "tool-started":
              setActivityLabel(
                TOOL_ACTIVITY_LABEL[event.name] ?? `a chamar ${event.name}`,
              );
              break;
            case "tool-completed":
              setActivityLabel(null);
              break;
            case "present-choices":
              finalPendingChoices = event.payload;
              break;
            case "done":
              finalAssistantContent = event.assistantContent as unknown[];
              finalPendingChoices =
                event.pendingChoices ?? finalPendingChoices;
              break streamLoop;
            case "error":
              throw new Error(event.message);
          }
        }
      }
    } catch (err) {
      // Network blip, server timeout, or Anthropic hiccup. The
      // conversation up to here is safe in the DB; this only affects
      // the in-flight turn. Roll back any optimistic user bubble,
      // restore the textarea so the user doesn't lose what they typed,
      // and surface a Retry banner.
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setLastFailedAttempt({
        text: opts.text,
        pickToolUseId: opts.pickToolUseId,
        displayLabel: opts.displayLabel,
      });
      if (opts.displayInUI) {
        setMessages((prev) => prev.slice(0, -1));
        setInput(opts.displayLabel ?? opts.text);
      }
      setStreamingText(null);
      setActivityLabel(null);
      setPending(false);
      return;
    }
    // Turn succeeded — clear any prior failure state.
    setLastFailedAttempt(null);

    // Finalize: commit the assistant turn (content = the real Anthropic
    // blocks from `done`, NOT the accumulated string — we want tool_use
    // blocks preserved for resume fidelity).
    if (finalAssistantContent) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          at: new Date().toISOString(),
          content: finalAssistantContent as unknown[],
        },
      ]);
    } else if (accumulatedText.trim()) {
      // Fallback: server didn't send a `done` event but we have text.
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          at: new Date().toISOString(),
          content: accumulatedText,
        },
      ]);
    }
    setStreamingText(null);
    setActivityLabel(null);
    setPendingChoices(finalPendingChoices);

    // Refresh sidebar from the server (it persisted token_usage + completed_fields).
    refreshProgress();

    // UX guard: silent assistant turn (no text, no pending choices).
    if (!accumulatedText.trim() && !finalPendingChoices) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          at: new Date().toISOString(),
          content: "Tudo registado. Como quiseres continuar.",
        },
      ]);
    }

    setPending(false);
  }

  /** Light fetch to re-sync sidebar after a streamed turn writes
   * completed_fields / completed_phases server-side. We don't have
   * those in the `done` event yet (the runner doesn't read them back),
   * so the client pulls them from /api/chat/progress. */
  async function refreshProgress() {
    try {
      const res = await fetch(`/api/chat/progress?requestId=${requestId}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        filledFields: string[];
        completedPhases: number[];
      };
      setFilledFields(data.filledFields);
      setCompletedPhases(data.completedPhases);
    } catch {
      // Silent — sidebar will catch up on next turn.
    }
  }

  function handleSend() {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    runTurn({ text, displayInUI: true });
  }

  function handlePick(choice: PresentChoicesPayload["choices"][number]) {
    if (!pendingChoices || pending) return;
    runTurn({
      text: choice.sample,
      pickToolUseId: pendingChoices.tool_use_id,
      displayInUI: true,
      displayLabel: choice.label,
    });
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  const greetingName = useMemo(() => {
    if (initial.contactName) return initial.contactName.split(" ")[0];
    return null;
  }, [initial.contactName]);

  return (
    <div className="mx-auto flex max-w-[1180px] gap-8 px-6 py-10 lg:py-14">
      {/* Main chat column */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="mb-6">
          <p
            className="text-[12px] uppercase text-text-secondary"
            style={{ letterSpacing: "0.02em" }}
          >
            Interview
            {initial.brandName ? ` · ${initial.brandName}` : null}
          </p>
          <h1
            className="mt-2 font-serif text-[28px] leading-[1.2]"
            style={{ letterSpacing: "-0.01em" }}
          >
            {greetingName
              ? `Let's get to it, ${greetingName}.`
              : "Let's get to it."}
          </h1>
          <p className="mt-2 text-[14px] text-text-secondary">
            Real conversation. No jargon. I&apos;ll ask, you answer, and when
            something needs a feel-based call, I&apos;ll show you 2-3 options to
            pick from.
          </p>
        </header>

        <div
          ref={scrollerRef}
          className="flex-1 space-y-6 overflow-y-auto pr-2"
          style={{ minHeight: "320px", maxHeight: "calc(100vh - 360px)" }}
        >
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          {streamingText !== null && streamingText.length > 0 ? (
            <StreamingBubble text={streamingText} />
          ) : null}
          {pending && (streamingText === null || streamingText.length === 0) ? (
            <ThinkingIndicator label={activityLabel} />
          ) : null}
          {pending && streamingText && activityLabel ? (
            <p className="pl-1 text-[12px] text-text-muted">{activityLabel}…</p>
          ) : null}
        </div>

        {/* Pending choices — buttons */}
        {pendingChoices ? (
          <ChoicesPanel choices={pendingChoices} onPick={handlePick} disabled={pending} />
        ) : null}

        {/* Composer */}
        <div className="mt-6 border-t pt-6" style={{ borderColor: "var(--color-border-subtle)" }}>
          {errorMsg && lastFailedAttempt ? (
            <div
              role="alert"
              className="mb-3 rounded-md border bg-bg-secondary p-3 text-[13px]"
              style={{ borderColor: "var(--color-border-emphasis)" }}
            >
              <p className="text-text-primary">
                That turn didn&apos;t go through. Your conversation up to
                this point is saved, and what you typed is back in the box.
              </p>
              <p className="mt-1 text-[12px] text-text-muted">
                {humanizeChatError(errorMsg)}
              </p>
              {/* Raw error (only useful for support). Hidden behind a
                  details summary so the user isn't shown JSON. */}
              <details className="mt-1">
                <summary className="cursor-pointer text-[11px] text-text-attribution hover:text-[color:var(--color-accent-purple)]">
                  Technical details
                </summary>
                <pre className="mt-1 max-h-[120px] overflow-auto rounded-md bg-bg-primary p-2 text-[11px] whitespace-pre-wrap text-text-muted">
                  {errorMsg}
                </pre>
              </details>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const attempt = lastFailedAttempt;
                    setErrorMsg(null);
                    setLastFailedAttempt(null);
                    runTurn({
                      text: attempt.text,
                      pickToolUseId: attempt.pickToolUseId,
                      displayInUI: true,
                      displayLabel: attempt.displayLabel,
                    });
                  }}
                  disabled={pending}
                  className="rounded-md bg-cta-bg px-3 py-1 text-[12px] font-medium text-cta-text hover:opacity-90 disabled:opacity-50"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setLastFailedAttempt(null);
                  }}
                  className="text-[12px] text-text-muted underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : errorMsg ? (
            <p role="alert" className="mb-3 text-[14px] text-text-primary">
              {errorMsg}
            </p>
          ) : null}
          <Textarea
            ref={composerRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              pendingChoices
                ? "Or type your own answer if none of the options fit…"
                : "Type your reply…"
            }
            rows={3}
            disabled={pending}
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[12px] text-text-muted">
              Press <kbd>⌘</kbd>+<kbd>Enter</kbd> to send.
            </p>
            <Button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || pending}
              size="md"
            >
              {pending ? "Sending…" : "Send"}
            </Button>
          </div>
          <p className="mt-3 text-center text-[11px] text-text-muted">
            Every reply is saved automatically. You can close this tab and
            come back to the same URL later. Your interview will resume
            where you left off.
          </p>
        </div>
      </section>

      {/* Progress sidebar */}
      <aside
        className="hidden w-[260px] shrink-0 self-start rounded-md border bg-bg-secondary p-5 lg:block"
        style={{ borderColor: "var(--color-border-subtle)", top: 24, position: "sticky" }}
      >
        <p
          className="text-[12px] uppercase text-text-secondary"
          style={{ letterSpacing: "0.02em" }}
        >
          Progress
        </p>
        <ProgressList
          filledFields={filledFields}
          completedPhases={completedPhases}
        />
        <p className="mt-6 text-[12px] text-text-muted">
          We&apos;ll mark phases done as we go. Nothing is final until you
          review the wrap-up at the end.
        </p>
      </aside>
    </div>
  );
}

/* ---------------- subcomponents ---------------- */

function MessageBubble({ message }: { message: Msg }) {
  const text = extractDisplayText(message);
  if (!text) return null;
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[560px] rounded-md px-4 py-3 text-[15px] leading-[1.55] whitespace-pre-wrap",
          isUser
            ? "bg-cta-bg text-cta-text"
            : "bg-bg-secondary text-text-primary border",
        )}
        style={
          isUser
            ? undefined
            : { borderColor: "var(--color-border-subtle)" }
        }
      >
        {text}
      </div>
    </div>
  );
}

function ChoicesPanel({
  choices,
  onPick,
  disabled,
}: {
  choices: PresentChoicesPayload;
  onPick: (c: PresentChoicesPayload["choices"][number]) => void;
  disabled: boolean;
}) {
  return (
    <div
      className="mt-6 rounded-md border bg-bg-secondary p-5"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <p className="text-[15px] font-medium text-text-primary">
        {choices.question}
      </p>
      {choices.context ? (
        <p className="mt-2 text-[14px] text-text-secondary">{choices.context}</p>
      ) : null}
      <div className="mt-4 grid gap-3">
        {choices.choices.map((c) => (
          <button
            key={c.key}
            type="button"
            disabled={disabled}
            onClick={() => onPick(c)}
            className={cn(
              "group rounded-md border bg-bg-primary p-4 text-left transition-opacity",
              "hover:bg-cta-bg hover:text-cta-text disabled:opacity-50 disabled:pointer-events-none",
            )}
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <span className="block text-[12px] uppercase text-text-secondary group-hover:text-cta-text" style={{ letterSpacing: "0.02em" }}>
              {c.label}
            </span>
            <span className="mt-2 block text-[14px] leading-[1.55] whitespace-pre-wrap text-text-primary group-hover:text-cta-text">
              {c.sample}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingIndicator({ label }: { label?: string | null }) {
  return (
    <div className="flex justify-start">
      <div
        className="rounded-md border bg-bg-secondary px-4 py-3 text-[14px] text-text-muted"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5">
            <Dot delay="0ms" />
            <Dot delay="120ms" />
            <Dot delay="240ms" />
          </span>
          {label ? <span className="text-text-secondary">{label}…</span> : null}
        </span>
      </div>
    </div>
  );
}

/** Live-rendering bubble that grows as text-delta events arrive. */
function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[560px] rounded-md border bg-bg-secondary px-4 py-3 text-[15px] leading-[1.55] whitespace-pre-wrap text-text-primary"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        {text}
        <span
          aria-hidden="true"
          className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-text-secondary align-text-bottom"
        />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-text-secondary"
      style={{ animationDelay: delay }}
    />
  );
}

function ProgressList({
  filledFields,
  completedPhases,
}: {
  filledFields: string[];
  completedPhases: number[];
}) {
  // Count filled fields per phase from "phase_N.qX_Y" strings.
  const counts: Record<Phase, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  for (const f of filledFields) {
    const m = f.match(/^phase_(\d)\./);
    if (!m) continue;
    const ph = Number(m[1]) as Phase;
    if (ph >= 1 && ph <= 7) counts[ph] += 1;
  }
  const completedSet = new Set(completedPhases);
  return (
    <ul className="mt-4 space-y-2">
      {(Object.keys(PHASE_NAMES) as unknown as Phase[])
        .map((p) => Number(p) as Phase)
        .sort((a, b) => a - b)
        .map((p) => {
          const done = completedSet.has(p);
          const count = counts[p];
          return (
            <li
              key={p}
              className="flex items-baseline justify-between text-[14px]"
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    done ? "bg-text-primary" : "bg-text-muted",
                  )}
                />
                <span className={done ? "text-text-primary" : "text-text-secondary"}>
                  {PHASE_NAMES[p]}
                </span>
              </span>
              <span className="text-[12px] text-text-muted">
                {done ? "done" : count > 0 ? `${count} filled` : ""}
              </span>
            </li>
          );
        })}
    </ul>
  );
}

/* ---------------- helpers ---------------- */

function extractDisplayText(m: Msg): string {
  // Hide the kickoff sentinel from the user-facing transcript.
  if (m.role === "user" && m.content === KICKOFF_SENTINEL) return "";
  if (typeof m.content === "string") return m.content;
  if (!Array.isArray(m.content)) return "";
  const parts: string[] = [];
  for (const block of m.content as Array<Record<string, unknown>>) {
    if (!block || typeof block !== "object") continue;
    const type = block.type as string | undefined;
    if (type === "text" && typeof block.text === "string") {
      parts.push(block.text);
    } else if (type === "tool_result") {
      // Hide the raw tool_result wrapper from the UI; show the inner content
      // if it's a plain string (the user's picked sample).
      const c = block.content;
      if (typeof c === "string") parts.push(c);
    }
    // tool_use blocks are intentionally hidden from the user view.
  }
  return parts.join("\n\n").trim();
}

/**
 * Translate raw API / network error strings into a one-sentence human
 * message. Keeps the technical detail hidden behind a `<details>` so
 * the user never sees a JSON response or stack-traced status code.
 *
 * Order matters: more specific patterns first.
 */
function humanizeChatError(raw: string): string {
  const text = raw.toLowerCase();
  if (text.includes("credit balance") || text.includes("plans & billing")) {
    return "Our AI service is temporarily out of credit. We've been notified; please try again in a few minutes.";
  }
  if (
    text.includes("rate") &&
    (text.includes("limit") || text.includes("429"))
  ) {
    return "Too many messages too quickly. Wait a moment and retry.";
  }
  if (
    text.includes("overloaded") ||
    text.includes("529") ||
    text.includes("503")
  ) {
    return "Our AI service is briefly overloaded. Retry in a minute.";
  }
  if (text.includes("timeout") || text.includes("aborted")) {
    return "The turn took too long and was cancelled. Retry to send again.";
  }
  if (
    text.includes("network") ||
    text.includes("failed to fetch") ||
    text.includes("offline")
  ) {
    return "Network issue. Check your connection and retry.";
  }
  if (text.startsWith("400") || text.includes("invalid_request_error")) {
    return "The request was rejected by the AI service. Retry; if it persists, contact support.";
  }
  if (text.startsWith("401") || text.startsWith("403")) {
    return "Authentication issue. Please reload the page and try again.";
  }
  if (text.startsWith("5") || text.includes("500")) {
    return "Something went wrong on our end. Retry; if it persists, we'll be in touch.";
  }
  return "The turn didn't complete. Retry, or contact support if it persists.";
}
