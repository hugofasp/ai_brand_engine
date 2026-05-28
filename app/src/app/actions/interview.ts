"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { phaseKey, type Phase } from "@/interview/types";
import { getImplementedPhases } from "@/interview/registry";
import { sendInternalNotification } from "@/lib/email/internal-notification";

/**
 * Load the request + its interview_answers row. Verifies the requestId
 * URL param matches the cookie — clients are unauthenticated, so the
 * cookie + UUID secrecy is the only resume-auth we have.
 */
export type InterviewState = {
  requestId: string;
  status: string;
  currentPhase: number;
  completedPhases: number[];
  answers: Record<string, unknown>;
  adminEdits: Record<string, unknown>;
  materialsContext: import("@/lib/supabase/types").MaterialsContext;
};

export async function loadInterviewState(
  requestId: string,
): Promise<InterviewState | { error: string }> {
  // Soft auth: the URL request id is a v4 UUID and unguessable enough for
  // v1, so it's authoritative on its own. The cookie is just a resume
  // convenience — we don't block on mismatch (different browser, shared
  // link, cleared storage). Callers may re-pin the cookie after loading.
  const supabase = getSupabaseAdmin();

  const { data: request, error: reqErr } = await supabase
    .from("requests")
    .select("id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (reqErr || !request) {
    return { error: "Request not found" };
  }

  const { data: answersRow, error: ansErr } = await supabase
    .from("interview_answers")
    .select(
      "request_id, current_phase, completed_phases, answers, admin_edits, materials_context",
    )
    .eq("request_id", requestId)
    .maybeSingle();

  if (ansErr) {
    return { error: ansErr.message };
  }

  if (!answersRow) {
    // First visit — create the row.
    const { data: created, error: createErr } = await supabase
      .from("interview_answers")
      .insert({ request_id: requestId })
      .select(
        "request_id, current_phase, completed_phases, answers, admin_edits, materials_context",
      )
      .single();
    if (createErr || !created) {
      return { error: createErr?.message ?? "Failed to initialize interview" };
    }

    // Also flip the request to interview_in_progress + stamp the start time.
    await supabase
      .from("requests")
      .update({
        status: "interview_in_progress",
        interview_started_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("status", "started");

    return {
      requestId,
      status: "interview_in_progress",
      currentPhase: (created.current_phase as number) ?? 1,
      completedPhases: (created.completed_phases as number[]) ?? [],
      answers: (created.answers as Record<string, unknown>) ?? {},
      adminEdits: (created.admin_edits as Record<string, unknown>) ?? {},
      materialsContext:
        ((created.materials_context as unknown) as InterviewState["materialsContext"]) ?? {},
    };
  }

  return {
    requestId,
    status: request.status as string,
    currentPhase: (answersRow.current_phase as number) ?? 1,
    completedPhases: (answersRow.completed_phases as number[]) ?? [],
    answers: (answersRow.answers as Record<string, unknown>) ?? {},
    adminEdits: (answersRow.admin_edits as Record<string, unknown>) ?? {},
    materialsContext:
      ((answersRow.materials_context as unknown) as InterviewState["materialsContext"]) ?? {},
  };
}

/**
 * Upsert a single question's answer into the JSONB blob at
 * answers.phase_X.qY_Z. Returns the resulting blob slice for the question.
 */
export async function saveAnswer(input: {
  requestId: string;
  phase: number;
  questionId: string;
  value: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.phase < 1 || input.phase > 7) {
    return { ok: false, error: "Invalid phase" };
  }

  const supabase = getSupabaseAdmin();

  // Read-modify-write the JSONB. PostgREST's jsonb_set would be cleaner via
  // an RPC, but for v1 the round-trip cost is acceptable and this keeps
  // the migration footprint small.
  const { data: row, error: readErr } = await supabase
    .from("interview_answers")
    .select("answers")
    .eq("request_id", input.requestId)
    .maybeSingle();

  if (readErr) return { ok: false, error: readErr.message };
  if (!row) return { ok: false, error: "Interview row missing" };

  const answers = (row.answers as Record<string, unknown>) ?? {};
  const pk = phaseKey(input.phase as Phase);
  const phaseBlob = ((answers[pk] as Record<string, unknown>) ?? {});
  phaseBlob[input.questionId] = input.value;
  answers[pk] = phaseBlob;

  const { error: writeErr } = await supabase
    .from("interview_answers")
    .update({ answers })
    .eq("request_id", input.requestId);

  if (writeErr) return { ok: false, error: writeErr.message };

  return { ok: true };
}

/** Mark a phase as completed. Idempotent. */
export async function markPhaseComplete(
  requestId: string,
  phase: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabaseAdmin();

  const { data: row, error: readErr } = await supabase
    .from("interview_answers")
    .select("completed_phases, current_phase")
    .eq("request_id", requestId)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!row) return { ok: false, error: "Interview row missing" };

  const completed = new Set(
    ((row.completed_phases as number[]) ?? []) as number[],
  );
  completed.add(phase);
  const nextPhase = Math.min(7, Math.max(phase + 1, (row.current_phase as number) ?? 1));

  const { error: writeErr } = await supabase
    .from("interview_answers")
    .update({
      completed_phases: Array.from(completed).sort((a, b) => a - b),
      current_phase: nextPhase,
    })
    .eq("request_id", requestId);
  if (writeErr) return { ok: false, error: writeErr.message };
  return { ok: true };
}

/**
 * Finalize the interview: mark request as interview_complete, stamp the
 * timestamp, redirect to /complete. The Phase-4 work wires the internal
 * notification email here.
 */
export async function submitInterview(requestId: string): Promise<never> {
  const supabase = getSupabaseAdmin();

  const phases = getImplementedPhases();
  const lastPhase = phases[phases.length - 1];
  if (lastPhase) {
    // Best-effort: ensure the final phase is marked complete before submit.
    await markPhaseComplete(requestId, lastPhase);
  }

  const { error } = await supabase
    .from("requests")
    .update({
      status: "interview_complete",
      interview_completed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) {
    throw new Error(`Failed to submit interview: ${error.message}`);
  }

  // Best-effort internal notification. Failure shouldn't block the user's
  // redirect — Phase 4 will harden retry behavior.
  try {
    await sendInternalNotification(requestId);
  } catch (e) {
    console.error("Internal notification failed:", e);
  }

  revalidatePath(`/complete/${requestId}`);
  redirect(`/complete/${requestId}`);
}
