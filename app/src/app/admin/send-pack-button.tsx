"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendDeliveryEmail } from "./actions";

/**
 * "Send pack to client" — fires the email delivery flow.
 *
 * Two-step UX:
 *   1. Click → expand a confirmation panel showing the contact email
 *      the message will be sent to (defensive: avoid accidental sends
 *      to the wrong address).
 *   2. Click "Send now" → fire. Show success with messageId +
 *      copy-able delivery URL. Status flips to "sent" on the request.
 */
export function SendPackButton({
  requestId,
  contactEmail,
  contactName,
  hasGeneratedFiles,
  alreadySent,
}: {
  requestId: string;
  contactEmail: string | null;
  contactName: string | null;
  hasGeneratedFiles: boolean;
  alreadySent: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  // Editable destination email, pre-filled with the stored contact.
  // If the admin changes it, that's a typo correction and we persist
  // it server-side.
  const [destEmail, setDestEmail] = useState<string>(contactEmail ?? "");
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destEmail.trim());
  const emailWasEdited =
    destEmail.trim() !== (contactEmail ?? "").trim() && destEmail.trim() !== "";
  const [outcome, setOutcome] = useState<
    | {
        kind: "ok";
        deliveryUrl: string;
        messageId: string | null;
        sentTo: string;
      }
    | { kind: "err"; message: string }
    | null
  >(null);

  function run() {
    if (!emailLooksValid) return;
    setOutcome(null);
    startTransition(async () => {
      const r = await sendDeliveryEmail(requestId, destEmail.trim());
      if (!r.ok) {
        setOutcome({ kind: "err", message: r.error });
        return;
      }
      setOutcome({
        kind: "ok",
        deliveryUrl: r.deliveryUrl,
        messageId: r.messageId,
        sentTo: r.sentTo,
      });
      router.refresh();
    });
  }

  if (!hasGeneratedFiles) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center rounded-md bg-cta-bg px-4 py-2 text-[13px] font-medium text-cta-text opacity-40"
        title="Generate the pack first."
      >
        {alreadySent ? "Resend to client" : "Send to client"}
      </button>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-cta-bg px-4 py-2 text-[13px] font-medium text-cta-text transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] active:bg-[color:var(--color-accent-purple-strong)]"
        >
          {alreadySent ? "Resend to client" : "Send to client"}
        </button>
      ) : (
        <div
          className="rounded-md border bg-bg-secondary p-4 text-[13px]"
          style={{ borderColor: "var(--color-border-emphasis)" }}
        >
          {outcome?.kind === "ok" ? (
            <div>
              <p className="font-medium text-text-primary">
                Sent. Email is on its way.
              </p>
              <p className="mt-1 text-[12px] text-text-muted">
                Delivered to{" "}
                <code className="text-text-primary">{outcome.sentTo}</code>
              </p>
              <p className="mt-1 text-[12px] text-text-muted">
                Resend message id:{" "}
                <code className="text-text-primary">
                  {outcome.messageId ?? "(none returned)"}
                </code>
              </p>
              <div className="mt-3 rounded-md border bg-bg-primary p-2 text-[11px]"
                style={{ borderColor: "var(--color-border-subtle)" }}>
                <p className="text-[10px] uppercase text-text-muted" style={{ letterSpacing: "0.04em" }}>
                  Delivery URL
                </p>
                <code className="mt-1 block break-all text-text-primary">
                  {outcome.deliveryUrl}
                </code>
              </div>
              <p className="mt-3 text-[12px] text-text-muted">
                The client will land on this page when they click the
                email link. The token rotates every send, so the URL
                above is the only one currently valid.
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setOutcome(null);
                  }}
                  className="text-[12px] text-text-muted underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
                >
                  Close
                </button>
              </div>
            </div>
          ) : outcome?.kind === "err" ? (
            <div>
              <p className="text-text-primary">
                The send didn&apos;t go through.
              </p>
              <p className="mt-1 text-[12px] text-text-muted">
                Reason: {outcome.message}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={run}
                  disabled={pending}
                  className="rounded-md bg-cta-bg px-3 py-1.5 text-[12px] font-medium text-cta-text transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] active:bg-[color:var(--color-accent-purple-strong)] disabled:opacity-50"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setOutcome(null);
                  }}
                  className="text-[12px] text-text-muted underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-text-primary">
                {alreadySent
                  ? "Send a fresh delivery email?"
                  : "Send the brand pack to the client?"}
              </p>
              <div className="mt-3 space-y-2">
                <label
                  htmlFor="send-pack-to"
                  className="block text-[11px] uppercase text-text-muted"
                  style={{ letterSpacing: "0.04em" }}
                >
                  Send to
                </label>
                <p className="text-[12px] text-text-secondary">
                  {contactName ?? "(no name on file)"}
                </p>
                <input
                  id="send-pack-to"
                  type="email"
                  value={destEmail}
                  onChange={(e) => setDestEmail(e.target.value)}
                  placeholder="name@company.com"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  disabled={pending}
                  className="block w-full rounded-sm border bg-bg-tertiary px-3 py-2 font-mono text-[13px] text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:border-border-emphasis disabled:opacity-50"
                  style={{
                    borderColor: emailLooksValid
                      ? "var(--color-border-subtle)"
                      : "var(--color-border-emphasis)",
                  }}
                />
                {!emailLooksValid && destEmail.length > 0 ? (
                  <p className="text-[11px] text-text-primary">
                    That doesn&apos;t look like a valid email.
                  </p>
                ) : null}
                {emailWasEdited && emailLooksValid ? (
                  <p className="text-[11px] text-text-muted">
                    Changed from{" "}
                    <span className="font-mono">{contactEmail}</span>. The
                    new address will be saved on the request.
                  </p>
                ) : null}
              </div>
              <p className="mt-3 text-[12px] text-text-muted">
                {alreadySent
                  ? "Any previously sent link stops working. The client gets a fresh download URL."
                  : "Subject: \"Your brand pack is ready.\" The email contains a unique download URL. Status flips to sent."}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={run}
                  disabled={pending || !emailLooksValid}
                  className="rounded-md bg-cta-bg px-3 py-1.5 text-[12px] font-medium text-cta-text transition-colors duration-150 hover:bg-[color:var(--color-accent-purple)] active:bg-[color:var(--color-accent-purple-strong)] disabled:opacity-50"
                >
                  {pending ? "Sending…" : "Send now"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="text-[12px] text-text-muted underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
