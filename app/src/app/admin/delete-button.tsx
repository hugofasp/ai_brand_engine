"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRequest } from "./actions";

/**
 * Delete button with a typed-confirmation flow. The confirmation panel
 * shows the brand + email of the row being deleted so the operator
 * can verify they're nuking the right one before committing.
 *
 * Two variants:
 *   `compact` — inline button for the list view (renders inside a table cell)
 *   `full`    — bigger CTA for the detail page (alongside other actions)
 */
export function DeleteRequestButton({
  requestId,
  brand,
  email,
  variant = "compact",
  onDeleted,
}: {
  requestId: string;
  brand: string | null;
  email: string | null;
  variant?: "compact" | "full";
  /** Optional override for the post-delete navigation. By default the
   * list view stays on /admin (router.refresh) and the detail view
   * sends the user back to /admin. */
  onDeleted?: "stay" | "back-to-admin";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function commit() {
    setError(null);
    startTransition(async () => {
      const r = await deleteRequest(requestId);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setOpen(false);
      if (onDeleted === "back-to-admin" || variant === "full") {
        router.push("/admin");
      } else {
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "compact"
            ? "text-[12px] text-text-muted underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
            : "inline-flex items-center justify-center rounded-md border bg-transparent px-4 py-2 text-[14px] text-text-primary transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] hover:text-cta-text hover:border-transparent active:bg-[color:var(--color-accent-purple-strong)]"
        }
        style={
          variant === "full"
            ? { borderColor: "var(--color-border-emphasis)" }
            : undefined
        }
      >
        Delete
      </button>
    );
  }

  return (
    <div
      className="rounded-md border bg-bg-secondary p-4 text-[13px]"
      style={{ borderColor: "var(--color-border-emphasis)" }}
    >
      <p className="font-medium text-text-primary">Delete this request?</p>
      <p className="mt-2 text-text-secondary">
        <span className="text-text-muted">Brand:</span>{" "}
        <span className="text-text-primary">{brand ?? "(no brand)"}</span>
      </p>
      <p className="text-text-secondary">
        <span className="text-text-muted">Email:</span>{" "}
        <span className="text-text-primary">{email ?? "(no email)"}</span>
      </p>
      <p className="mt-3 text-[12px] text-text-muted">
        Permanently removes the request, interview answers, conversation
        and extracted drafts. Cannot be undone.
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-text-primary">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={commit}
          disabled={pending}
          className="rounded-md bg-cta-bg px-3 py-1.5 text-[13px] text-cta-text transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] active:bg-[color:var(--color-accent-purple-strong)] disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={pending}
          className="rounded-md border bg-transparent px-3 py-1.5 text-[13px] text-text-primary transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] hover:text-cta-text hover:border-transparent active:bg-[color:var(--color-accent-purple-strong)] disabled:opacity-50"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
