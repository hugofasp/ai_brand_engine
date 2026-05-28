"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { runConversationTurn } from "@/lib/conversational/run-turn";
import type {
  InterviewConversation,
  ConversationMessage,
  MaterialsContext,
  ContactRole,
} from "@/lib/supabase/types";
import type { PresentChoicesPayload } from "@/lib/conversational/tools";

/** Plain-text helper: text content of an assistant turn. */
function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((b): b is { type: "text"; text: string } => b && typeof b === "object" && (b as { type?: string }).type === "text")
      .map((b) => b.text)
      .join("\n\n");
  }
  return "";
}

export type ChatTurnResponse =
  | {
      ok: true;
      assistantText: string;
      assistantContent: unknown;
      pendingChoices: PresentChoicesPayload | null;
      filledFields: string[];
      completedPhases: number[];
    }
  | { ok: false; error: string };

export type ChatBootstrap = {
  messages: ConversationMessage[];
  pendingChoices: PresentChoicesPayload | null;
  filledFields: string[];
  completedPhases: number[];
  brandName: string | null;
  contactName: string | null;
  contactRole: ContactRole | null;
  hasMaterials: boolean;
};

async function loadContext(requestId: string): Promise<
  | {
      ok: true;
      conversation: InterviewConversation;
      answers: Record<string, unknown>;
      materialsContext: MaterialsContext;
      brandName: string | null;
      contactName: string | null;
      contactRole: ContactRole | null;
      completedPhases: number[];
    }
  | { ok: false; error: string }
> {
  const supabase = getSupabaseAdmin();
  const { data: request, error: reqErr } = await supabase
    .from("requests")
    .select("company_name, contact_name, contact_role, status")
    .eq("id", requestId)
    .maybeSingle();
  if (reqErr || !request) {
    return { ok: false, error: reqErr?.message ?? "Request not found." };
  }

  const { data: answersRow, error: ansErr } = await supabase
    .from("interview_answers")
    .select(
      "answers, interview_conversation, materials_context, completed_phases",
    )
    .eq("request_id", requestId)
    .maybeSingle();
  if (ansErr) {
    return { ok: false, error: ansErr.message };
  }
  if (!answersRow) {
    // First visit — create the row.
    const { data: created, error: createErr } = await supabase
      .from("interview_answers")
      .insert({ request_id: requestId })
      .select(
        "answers, interview_conversation, materials_context, completed_phases",
      )
      .single();
    if (createErr || !created) {
      return {
        ok: false,
        error: createErr?.message ?? "Failed to initialize.",
      };
    }
    await supabase
      .from("requests")
      .update({
        status: "interview_in_progress",
        interview_started_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("status", "started");
    return {
      ok: true,
      conversation:
        (created.interview_conversation as InterviewConversation) ?? {},
      answers: (created.answers as Record<string, unknown>) ?? {},
      materialsContext:
        (created.materials_context as MaterialsContext) ?? {},
      brandName: request.company_name as string,
      contactName: (request.contact_name as string) ?? null,
      contactRole: (request.contact_role as ContactRole) ?? null,
      completedPhases: (created.completed_phases as number[]) ?? [],
    };
  }

  return {
    ok: true,
    conversation:
      (answersRow.interview_conversation as InterviewConversation) ?? {},
    answers: (answersRow.answers as Record<string, unknown>) ?? {},
    materialsContext:
      (answersRow.materials_context as MaterialsContext) ?? {},
    brandName: request.company_name as string,
    contactName: (request.contact_name as string) ?? null,
    contactRole: (request.contact_role as ContactRole) ?? null,
    completedPhases: (answersRow.completed_phases as number[]) ?? [],
  };
}

export async function bootstrapChat(
  requestId: string,
): Promise<{ ok: true; data: ChatBootstrap } | { ok: false; error: string }> {
  // URL request id is unguessable; cookie is just a resume convenience.
  // Don't block on mismatch.
  const ctx = await loadContext(requestId);
  if (!ctx.ok) return ctx;

  const conversation = ctx.conversation;
  const messages = conversation.messages ?? [];
  const filledFields = conversation.completed_fields ?? [];
  const hasMaterials = Boolean(ctx.materialsContext.extracted_at);

  return {
    ok: true,
    data: {
      messages,
      pendingChoices: null,
      filledFields,
      completedPhases: ctx.completedPhases,
      brandName: ctx.brandName,
      contactName: ctx.contactName,
      contactRole: ctx.contactRole,
      hasMaterials,
    },
  };
}

/**
 * Send a user message and get Claude's next turn back.
 * `pickToolUseId` is set when the user message is responding to a
 * present_choices call — it carries the matching tool_use_id so the
 * follow-up message contains a tool_result block.
 */
export async function sendChatMessage(input: {
  requestId: string;
  userText: string;
  pickToolUseId?: string;
}): Promise<ChatTurnResponse> {
  if (!input.userText.trim()) {
    return { ok: false, error: "Message is empty." };
  }

  const ctx = await loadContext(input.requestId);
  if (!ctx.ok) return ctx;

  const conversation = ctx.conversation;
  const prior: ConversationMessage[] = conversation.messages ?? [];

  // Append the user's new message. If responding to a present_choices,
  // the content is a tool_result block + the text.
  const now = new Date().toISOString();
  let userMessage: ConversationMessage;
  if (input.pickToolUseId) {
    userMessage = {
      role: "user",
      at: now,
      content: [
        {
          type: "tool_result",
          tool_use_id: input.pickToolUseId,
          content: input.userText,
        },
      ],
    };
  } else {
    userMessage = {
      role: "user",
      at: now,
      content: input.userText,
    };
  }
  const updatedPrior = [...prior, userMessage];

  // Run the agentic loop.
  let turn;
  try {
    turn = await runConversationTurn({
      requestId: input.requestId,
      prior: updatedPrior,
      role: ctx.contactRole,
      brandName: ctx.brandName,
      contactName: ctx.contactName,
      materialsContext: ctx.materialsContext,
      answers: ctx.answers,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Persist the user + assistant messages.
  //
  // RACE FIX: executeUpdateFields runs DURING the agentic loop and writes
  // `interview_conversation.completed_fields` / `.archetype_decisions`
  // directly to the row. If we naively spread the stale `conversation`
  // object captured before the turn, we'd clobber those writes (the
  // progress sidebar would never advance). Re-read the row's CURRENT
  // interview_conversation before merging in our own additions (messages,
  // last_active, role, started_at).
  const assistantMessage: ConversationMessage = {
    role: "assistant",
    at: new Date().toISOString(),
    content: turn.assistantContent as unknown[],
    tool_uses: turn.toolUses.map((t) => ({
      name: t.name,
      input: t.input,
      result: t.result,
    })),
  };
  const supabase = getSupabaseAdmin();
  const { data: latestRow } = await supabase
    .from("interview_answers")
    .select("interview_conversation, completed_phases")
    .eq("request_id", input.requestId)
    .maybeSingle();
  const latestConv: InterviewConversation =
    (latestRow?.interview_conversation as InterviewConversation | undefined) ??
    conversation;

  const startedAt = latestConv.started_at ?? conversation.started_at ?? now;
  const priorUsage = latestConv.token_usage ?? {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    turn_count: 0,
  };
  const nextUsage = {
    input_tokens: priorUsage.input_tokens + turn.usage.input_tokens,
    output_tokens: priorUsage.output_tokens + turn.usage.output_tokens,
    cache_creation_input_tokens:
      priorUsage.cache_creation_input_tokens +
      turn.usage.cache_creation_input_tokens,
    cache_read_input_tokens:
      priorUsage.cache_read_input_tokens +
      turn.usage.cache_read_input_tokens,
    turn_count: priorUsage.turn_count + 1,
  };
  const nextConv: InterviewConversation = {
    ...latestConv,
    started_at: startedAt,
    last_active: assistantMessage.at,
    role: ctx.contactRole,
    messages: [...updatedPrior, assistantMessage],
    token_usage: nextUsage,
  };

  const { error: writeErr } = await supabase
    .from("interview_answers")
    .update({ interview_conversation: nextConv })
    .eq("request_id", input.requestId);
  if (writeErr) {
    return { ok: false, error: writeErr.message };
  }

  // Re-read completed_phases (executeMarkPhaseComplete may have changed it).
  const { data: refreshed } = await supabase
    .from("interview_answers")
    .select("completed_phases, interview_conversation")
    .eq("request_id", input.requestId)
    .maybeSingle();
  const completedPhases =
    (refreshed?.completed_phases as number[]) ?? [];
  const filledFields =
    ((refreshed?.interview_conversation as InterviewConversation | undefined)
      ?.completed_fields) ?? [];

  revalidatePath(`/interview/${input.requestId}/chat`);

  return {
    ok: true,
    assistantText: textOf(turn.assistantContent),
    assistantContent: turn.assistantContent,
    pendingChoices: turn.pendingChoices,
    filledFields,
    completedPhases,
  };
}
