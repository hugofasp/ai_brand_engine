import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadInterviewState } from "@/app/actions/interview";
import { MaterialsPage } from "@/interview/components/materials-page";

export const metadata: Metadata = {
  title: "Interview",
  robots: { index: false, follow: false },
};

/**
 * Conversational pivot: `/interview/[id]` is now a router, not a host.
 *
 *  - If the request is submitted/sent/files-generated → /complete
 *  - If the user explicitly lands on ?phase=0 (or it's their first visit
 *    with no materials and no prior answers) → render the materials page.
 *    The materials page redirects to /chat on success or skip.
 *  - Otherwise → /interview/[id]/chat (Claude takes over).
 *
 * The legacy structured-form flow has been retired in favour of the
 * conversational engine. The form-UI code remains in the tree until the
 * chat flow is validated end-to-end; once verified, it can be deleted.
 */
export default async function InterviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ phase?: string }>;
}) {
  const { requestId } = await params;
  const { phase: phaseParam } = await searchParams;

  const state = await loadInterviewState(requestId);
  if ("error" in state) {
    notFound();
  }

  if (
    state.status === "interview_complete" ||
    state.status === "sent" ||
    state.status === "files_generated"
  ) {
    redirect(`/complete/${requestId}`);
  }

  const phaseNum = Number(phaseParam);
  const hasAnyAnswers = Object.keys(state.answers).length > 0;
  const hasMaterials = Boolean(state.materialsContext.extracted_at);

  // Phase 0 — materials gathering. Explicit ?phase=0, or first-time visitor
  // with nothing on file yet.
  if (phaseNum === 0 || (!phaseParam && !hasAnyAnswers && !hasMaterials)) {
    return (
      <MaterialsPage
        requestId={requestId}
        initialContext={state.materialsContext}
      />
    );
  }

  // Anything else → conversational chat.
  redirect(`/interview/${requestId}/chat`);
}
