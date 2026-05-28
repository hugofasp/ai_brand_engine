import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { bootstrapChat } from "@/app/actions/chat";
import { loadInterviewState } from "@/app/actions/interview";
import { ChatClient } from "./chat-client";

export const metadata: Metadata = {
  title: "Interview",
  robots: { index: false, follow: false },
};

export default async function ChatPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  const state = await loadInterviewState(requestId);
  if ("error" in state) {
    return <LostThread requestId={requestId} reason={state.error} where="loadInterviewState" />;
  }
  if (
    state.status === "interview_complete" ||
    state.status === "sent" ||
    state.status === "files_generated"
  ) {
    redirect(`/complete/${requestId}`);
  }

  const boot = await bootstrapChat(requestId);
  if (!boot.ok) {
    return <LostThread requestId={requestId} reason={boot.error} where="bootstrapChat" />;
  }

  return <ChatClient requestId={requestId} initial={boot.data} />;
}

/** Visible failure mode for the chat page. Avoids the silent global
 * not-found so we can see exactly which step failed during testing. */
function LostThread({
  requestId,
  reason,
  where,
}: {
  requestId: string;
  reason: string;
  where: string;
}) {
  return (
    <section className="mx-auto max-w-[640px] px-6 py-24 text-center">
      <p
        className="text-[12px] uppercase text-text-secondary"
        style={{ letterSpacing: "0.02em" }}
      >
        Interview
      </p>
      <h1
        className="mt-4 font-serif text-[32px] leading-[1.2]"
        style={{ letterSpacing: "-0.015em" }}
      >
        We lost the thread for a second.
      </h1>
      <p className="mt-4 text-[14px] text-text-secondary">
        Something blocked the chat from loading. The interview is still
        saved. You can refresh, or email us and we&apos;ll pick it back up.
      </p>
      <div className="mx-auto mt-8 max-w-[520px] rounded-md border bg-bg-secondary p-4 text-left text-[12px] text-text-muted">
        <p>
          <span className="text-text-secondary">where:</span> {where}
        </p>
        <p className="mt-1">
          <span className="text-text-secondary">reason:</span> {reason}
        </p>
        <p className="mt-1">
          <span className="text-text-secondary">request:</span> {requestId}
        </p>
      </div>
      <p className="mt-8 text-[13px] text-text-muted">
        <Link className="underline underline-offset-4" href="/">
          Home
        </Link>{" "}
        ·{" "}
        <Link
          className="underline underline-offset-4"
          href={`/interview/${requestId}`}
        >
          Restart from here
        </Link>
      </p>
    </section>
  );
}
