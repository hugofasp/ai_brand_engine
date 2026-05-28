import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { phaseKey, type Phase } from "@/interview/types";
import { sanitizeBrandValue } from "@/lib/text/sanitize";
import type {
  InterviewConversation,
  MaterialsContext,
} from "@/lib/supabase/types";

/**
 * Tool definitions for Claude's conversational interview. Four tools:
 *
 *   1. update_fields — fills framework answer slots
 *   2. mark_phase_complete — marks a phase as done
 *   3. flag_uncertain — flags an inferred value for user review
 *   4. present_choices — proposes A/B/C/... choices to the user
 *
 * Tools 1-3 execute side-effects on the server and return ack to Claude.
 * Tool 4 PAUSES the agentic loop — the choices go to the UI as buttons,
 * the user's pick comes back as a follow-up user message in the next
 * turn. We don't auto-execute present_choices; it's a "render hint" the
 * runner forwards to the client.
 */

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "update_fields",
    description:
      "Fill one or more framework answer fields from the conversation so far. Call this whenever you have enough signal to populate a field — don't wait until the end of the conversation. Multiple calls per turn are fine.",
    input_schema: {
      type: "object",
      properties: {
        updates: {
          type: "array",
          description:
            "One or more field updates. Each item targets a single framework field by phase + question id.",
          items: {
            type: "object",
            properties: {
              phase: {
                type: "integer",
                minimum: 1,
                maximum: 7,
                description:
                  "Framework phase number (1 = Foundation, 2 = Audience, 3 = Pillars, 4 = Voice, 5 = Lexicon, 6 = Channel specs, 7 = Examples).",
              },
              question_id: {
                type: "string",
                description:
                  "Field id from the framework checklist (e.g., 'q1_1', 'q1_3', 'q3_2', 'q2_3').",
              },
              value: {
                description:
                  "The value to store. Shape must match the field's expected type per the framework checklist (scalar, list, object, structured list, etc.).",
              },
              source_quote: {
                type: "string",
                description:
                  "Verbatim quote from the user's message, materials, or paraphrase of their picked choice. Used for audit trail and admin review. Required.",
              },
              archetype_chosen: {
                type: "string",
                description:
                  "If this update encodes a voice/tone decision the user made by picking an archetype sample, include the archetype key here (e.g., 'sage', 'ruler'). Optional.",
              },
            },
            required: ["phase", "question_id", "value", "source_quote"],
          },
        },
      },
      required: ["updates"],
    },
  },
  {
    name: "mark_phase_complete",
    description:
      "Call when every required field for a phase is filled and you're ready to move to the next phase. Surfaces a checkmark in the user-facing sidebar.",
    input_schema: {
      type: "object",
      properties: {
        phase: {
          type: "integer",
          minimum: 1,
          maximum: 7,
          description: "Phase number to mark complete.",
        },
        rationale: {
          type: "string",
          description:
            "Short rationale for the admin log — what makes this phase complete?",
        },
      },
      required: ["phase", "rationale"],
    },
  },
  {
    name: "flag_uncertain",
    description:
      "Call when you've inferred a value but want the user to review it later. Use sparingly — overusing it signals to the user that you're not confident anywhere.",
    input_schema: {
      type: "object",
      properties: {
        phase: { type: "integer", minimum: 1, maximum: 7 },
        question_id: { type: "string" },
        reason: {
          type: "string",
          description: "Why this is uncertain (one sentence).",
        },
      },
      required: ["phase", "question_id", "reason"],
    },
  },
  {
    name: "present_choices",
    description:
      "Propose 2-4 choices to the user as buttons. Use heavily for voice/tone decisions: write the same hypothetical post in 2-3 archetype voices, ask which fits. Do NOT name archetypes to the user — just show the samples. After calling this, STOP — the user will respond by picking, and your next turn will see their pick as a user message.",
    input_schema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description:
            "The plain-English question shown above the choices (e.g., 'Which of these sounds most like your brand?').",
        },
        context: {
          type: "string",
          description:
            "Optional short paragraph framing what the user's picking and why (e.g., 'These are three takes on the same hypothetical LinkedIn post about your spring product launch.'). Empty string if not needed.",
        },
        choices: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
                description:
                  "Stable identifier for the choice (e.g., 'a', 'b', 'c' or an archetype key like 'sage').",
              },
              label: {
                type: "string",
                description:
                  "Short label shown on the button (e.g., 'This one').",
              },
              sample: {
                type: "string",
                description:
                  "The full sample text or full choice content the user is choosing between.",
              },
            },
            required: ["key", "label", "sample"],
          },
        },
        related_field: {
          type: "string",
          description:
            "Which framework field this choice will inform once the user picks (e.g., 'q4_1', 'q1_3'). Optional but recommended.",
        },
      },
      required: ["question", "choices"],
    },
  },
];

// --- Executors ---

/** Returned to Claude as a tool_result. */
export type ToolExecResult =
  | { ok: true; ack: string; data?: unknown }
  | { ok: false; error: string };

/** Side-effect tool results we collect server-side for logging. */
export type ToolUseTrace = {
  name: string;
  input: Record<string, unknown>;
  result: ToolExecResult;
};

export type PresentChoicesPayload = {
  question: string;
  context?: string;
  choices: Array<{ key: string; label: string; sample: string }>;
  related_field?: string;
  /** Carried so the UI can include this in the tool_result when the user picks. */
  tool_use_id: string;
};

export async function executeUpdateFields(
  requestId: string,
  input: { updates: Array<{ phase: number; question_id: string; value: unknown; source_quote: string; archetype_chosen?: string }> },
): Promise<ToolExecResult> {
  const supabase = getSupabaseAdmin();
  const { data: row, error: readErr } = await supabase
    .from("interview_answers")
    .select("answers, interview_conversation, materials_context")
    .eq("request_id", requestId)
    .maybeSingle();
  if (readErr || !row) {
    return {
      ok: false,
      error: readErr?.message ?? "Interview row missing.",
    };
  }
  const answers = (row.answers as Record<string, unknown>) ?? {};
  const conversation =
    (row.interview_conversation as InterviewConversation | undefined) ?? {};
  const completedSet = new Set(conversation.completed_fields ?? []);
  const archetypeDecisions: Record<string, string> = {
    ...(conversation.archetype_decisions ?? {}),
  };

  const updatedFields: string[] = [];
  for (const upd of input.updates) {
    if (upd.phase < 1 || upd.phase > 7) continue;
    const pk = phaseKey(upd.phase as Phase);
    const phaseBlob = ((answers[pk] as Record<string, unknown>) ?? {});
    // Strip em-dashes / en-dashes from any string anywhere in the
    // value tree before persisting. The brand pack is the source of
    // truth for downstream LLM content generation, so the rule has to
    // be enforced at the boundary, not in renderers.
    phaseBlob[upd.question_id] = sanitizeBrandValue(upd.value);
    answers[pk] = phaseBlob;
    completedSet.add(`${pk}.${upd.question_id}`);
    updatedFields.push(`${pk}.${upd.question_id}`);
    if (upd.archetype_chosen) {
      archetypeDecisions[upd.question_id] = upd.archetype_chosen;
    }
  }

  const nextConv: InterviewConversation = {
    ...conversation,
    completed_fields: Array.from(completedSet).sort(),
    archetype_decisions: archetypeDecisions,
    last_active: new Date().toISOString(),
  };

  const { error: writeErr } = await supabase
    .from("interview_answers")
    .update({ answers, interview_conversation: nextConv })
    .eq("request_id", requestId);
  if (writeErr) {
    return { ok: false, error: writeErr.message };
  }

  return {
    ok: true,
    ack: `Filled ${updatedFields.length} field(s): ${updatedFields.join(", ")}`,
    data: { updated: updatedFields },
  };
}

export async function executeMarkPhaseComplete(
  requestId: string,
  input: { phase: number; rationale: string },
): Promise<ToolExecResult> {
  if (input.phase < 1 || input.phase > 7) {
    return { ok: false, error: "Invalid phase." };
  }
  const supabase = getSupabaseAdmin();
  const { data: row, error: readErr } = await supabase
    .from("interview_answers")
    .select("completed_phases, current_phase")
    .eq("request_id", requestId)
    .maybeSingle();
  if (readErr || !row) {
    return { ok: false, error: readErr?.message ?? "Interview row missing." };
  }
  const completed = new Set(
    ((row.completed_phases as number[]) ?? []) as number[],
  );
  completed.add(input.phase);
  const nextPhase = Math.min(
    7,
    Math.max(input.phase + 1, (row.current_phase as number) ?? 1),
  );

  const { error: writeErr } = await supabase
    .from("interview_answers")
    .update({
      completed_phases: Array.from(completed).sort((a, b) => a - b),
      current_phase: nextPhase,
    })
    .eq("request_id", requestId);
  if (writeErr) return { ok: false, error: writeErr.message };

  // Wrap-up detection: when phases 1-5 are all complete, flip the
  // request to `interview_complete` and fire the admin notification.
  // Phases 6 & 7 are optional per the framework checklist; we don't
  // gate completion on them.
  const requiredPhases = [1, 2, 3, 4, 5];
  const allRequiredDone = requiredPhases.every((p) => completed.has(p));
  if (allRequiredDone) {
    const { data: reqRow } = await supabase
      .from("requests")
      .select("status")
      .eq("id", requestId)
      .maybeSingle();
    const currentStatus = (reqRow?.status as string | undefined) ?? "";
    if (
      currentStatus === "started" ||
      currentStatus === "interview_in_progress"
    ) {
      await supabase
        .from("requests")
        .update({
          status: "interview_complete",
          interview_completed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      // Fire admin notification. Best-effort, never block the agentic
      // loop on it. Use dynamic import so the conversational tools
      // file doesn't pull the email/Resend chain at module load.
      try {
        const { sendInternalNotification } = await import(
          "@/lib/email/internal-notification"
        );
        await sendInternalNotification(requestId, "interview_complete");
      } catch (e) {
        console.error("Admin interview_complete notification failed:", e);
      }
    }
  }

  return {
    ok: true,
    ack: `Phase ${input.phase} marked complete. (${input.rationale.slice(0, 100)})`,
  };
}

export async function executeFlagUncertain(
  requestId: string,
  input: { phase: number; question_id: string; reason: string },
): Promise<ToolExecResult> {
  // Light-touch implementation: log the uncertainty against the
  // materials_context.drafts entry for that question. The admin panel
  // can surface these later.
  const supabase = getSupabaseAdmin();
  const { data: row, error: readErr } = await supabase
    .from("interview_answers")
    .select("materials_context")
    .eq("request_id", requestId)
    .maybeSingle();
  if (readErr || !row) {
    return { ok: false, error: readErr?.message ?? "Interview row missing." };
  }
  const ctx = (row.materials_context as MaterialsContext | undefined) ?? {};
  const drafts: Record<string, unknown> = { ...(ctx.drafts ?? {}) };
  const existing = (drafts[input.question_id] as Record<string, unknown>) ?? {};
  drafts[input.question_id] = {
    ...existing,
    uncertain: true,
    uncertain_reason: input.reason,
    uncertain_at: new Date().toISOString(),
  };
  const nextCtx = { ...ctx, drafts } as MaterialsContext;
  const { error: writeErr } = await supabase
    .from("interview_answers")
    .update({ materials_context: nextCtx })
    .eq("request_id", requestId);
  if (writeErr) return { ok: false, error: writeErr.message };
  return {
    ok: true,
    ack: `Flagged ${input.question_id} as uncertain. (${input.reason.slice(0, 100)})`,
  };
}

/**
 * Dispatch a tool_use block to its executor. Returns the tool_result
 * content to feed back to Claude in the next turn of the agentic loop.
 *
 * Special case: present_choices is NOT executed here. The runner detects
 * it and pauses; the UI handles rendering and the user's pick becomes
 * the next user message.
 */
export async function executeServerTool(
  requestId: string,
  name: string,
  input: Record<string, unknown>,
): Promise<ToolExecResult> {
  switch (name) {
    case "update_fields":
      return executeUpdateFields(
        requestId,
        input as Parameters<typeof executeUpdateFields>[1],
      );
    case "mark_phase_complete":
      return executeMarkPhaseComplete(
        requestId,
        input as Parameters<typeof executeMarkPhaseComplete>[1],
      );
    case "flag_uncertain":
      return executeFlagUncertain(
        requestId,
        input as Parameters<typeof executeFlagUncertain>[1],
      );
    default:
      return { ok: false, error: `Unknown server tool: ${name}` };
  }
}
