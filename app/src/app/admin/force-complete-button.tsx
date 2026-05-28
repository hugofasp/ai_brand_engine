"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { forceCompleteInterview } from "./actions";

/**
 * Admin debug control: simulate "interview complete" for this request.
 * Flips the status server-side AND fires the admin notification email,
 * so the operator can verify Resend wiring without driving the chat
 * through every phase.
 */
export function ForceCompleteButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    | { kind: "ok"; sent: boolean; error?: string }
    | { kind: "err"; message: string }
    | null
  >(null);

  function run() {
    setResult(null);
    startTransition(async () => {
      const r = await forceCompleteInterview(requestId);
      if (!r.ok) {
        setResult({ kind: "err", message: r.error });
        return;
      }
      setResult({
        kind: "ok",
        sent: r.notification.sent,
        error: r.notification.error,
      });
      router.refresh();
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1.5 text-[13px] text-text-secondary transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] hover:text-cta-text hover:border-transparent active:bg-[color:var(--color-accent-purple-strong)] disabled:opacity-50"
        style={{ borderColor: "var(--color-border-subtle)" }}
        title="Mark interview_complete and fire admin email (test only)"
      >
        {pending ? "Triggering…" : "Force complete (test)"}
      </button>
      {result?.kind === "ok" ? (
        <span className="text-[11px] text-text-muted">
          {result.sent
            ? "Email sent ✓"
            : `No email (${result.error ?? "Resend not configured"})`}
        </span>
      ) : null}
      {result?.kind === "err" ? (
        <span className="text-[11px] text-text-primary">{result.message}</span>
      ) : null}
    </div>
  );
}
