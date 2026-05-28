import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { assertEnv } from "@/lib/env";
import { buildSystemPromptParts } from "@/interview/conversational/system-prompt";
import {
  TOOLS,
  executeServerTool,
  type ToolUseTrace,
  type PresentChoicesPayload,
} from "./tools";
import type {
  ConversationMessage,
  ContactRole,
  MaterialsContext,
} from "@/lib/supabase/types";

/* ------------------------------------------------------------------ *
 * Streaming events emitted by streamConversationTurn.                 *
 *                                                                     *
 * The Route Handler forwards these verbatim to the browser as SSE     *
 * data events; the chat client renders them incrementally.            *
 * ------------------------------------------------------------------ */

export type TurnStreamEvent =
  | {
      type: "iteration-start";
      iteration: number;
    }
  | {
      /** A chunk of assistant-visible prose. The client appends to the
       * current message in place. */
      type: "text-delta";
      delta: string;
    }
  | {
      /** A server-side tool is about to run. The client surfaces this
       * as a friendly activity indicator (e.g., "a registar resposta"). */
      type: "tool-started";
      name: string;
    }
  | {
      /** Server-side tool finished. */
      type: "tool-completed";
      name: string;
      ok: boolean;
      ack?: string;
    }
  | {
      /** Claude paused with present_choices — the client renders buttons. */
      type: "present-choices";
      payload: PresentChoicesPayload;
    }
  | {
      /** Terminal event — emitted exactly once per turn. */
      type: "done";
      assistantContent: Anthropic.ContentBlock[];
      toolUses: ToolUseTrace[];
      pendingChoices: PresentChoicesPayload | null;
      finalStopReason: string | null;
      usage: {
        input_tokens: number;
        output_tokens: number;
        cache_creation_input_tokens: number;
        cache_read_input_tokens: number;
      };
    }
  | {
      type: "error";
      message: string;
    };

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;
// Tight enough to force decisive turns; loose enough for: text + 1-2
// update_fields + (optional) mark_phase_complete + (optional) present_choices.
const MAX_LOOP_ITERATIONS = 4;

/**
 * Run one conversational turn: the user has just sent a message, we
 * call Claude, auto-execute server tools, and loop until Claude either
 * (a) finishes (stop_reason = end_turn) or (b) calls present_choices
 * (which pauses the loop — the UI shows buttons, the user's pick
 * becomes the next turn's user message).
 *
 * Returns the final assistant content + the trace of tool uses + any
 * pending present_choices payload for the UI.
 */
export type TurnResult = {
  /** Raw assistant content blocks from the last Claude response.
   * Stored verbatim in interview_conversation.messages for resume fidelity. */
  assistantContent: Anthropic.ContentBlock[];
  /** Server-side tool executions, for audit logging. */
  toolUses: ToolUseTrace[];
  /** When present, Claude is awaiting a user pick. The UI renders buttons. */
  pendingChoices: PresentChoicesPayload | null;
  /** stop_reason from the LAST Claude response in the loop. */
  finalStopReason: string | null;
  /** Token usage aggregated across all loop iterations. Includes
   * cache-read and cache-creation counts so we can verify the prefix
   * cache is hitting (cache_read_input_tokens should dominate after the
   * first turn within a 5-minute window). */
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
};

export async function runConversationTurn(input: {
  requestId: string;
  prior: ConversationMessage[];
  role: ContactRole | null;
  brandName: string | null;
  contactName: string | null;
  materialsContext: MaterialsContext;
  answers: Record<string, unknown>;
}): Promise<TurnResult> {
  const apiKey = assertEnv("AIBE_ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });

  // Split form for prompt caching. The stable block (CORE + checklist
  // + archetype reference) is identical across all interviews and gets
  // an ephemeral cache marker — first turn pays full input price, every
  // subsequent turn within 5 minutes reads from cache (~10% of normal
  // input cost and dramatically lower TTFT).
  const promptParts = buildSystemPromptParts({
    role: input.role,
    materialsContext: input.materialsContext,
    answers: input.answers,
    brandName: input.brandName,
    contactName: input.contactName,
  });
  const system: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: promptParts.stable,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: promptParts.dynamic,
    },
  ];

  // Translate the persisted conversation into the Anthropic MessageParam[]
  // shape. Each ConversationMessage either has plain string content or a
  // pre-serialized content-block array (when it carried tool_use blocks).
  const messages: Anthropic.MessageParam[] = input.prior.map((m) => ({
    role: m.role,
    content:
      typeof m.content === "string"
        ? m.content
        : (m.content as Anthropic.ContentBlockParam[]),
  }));

  const usage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  };
  const toolUses: ToolUseTrace[] = [];
  let assistantContent: Anthropic.ContentBlock[] = [];
  let finalStopReason: string | null = null;
  let pendingChoices: PresentChoicesPayload | null = null;

  for (let iteration = 0; iteration < MAX_LOOP_ITERATIONS; iteration++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      tools: TOOLS,
      messages,
    });

    usage.input_tokens += response.usage?.input_tokens ?? 0;
    usage.output_tokens += response.usage?.output_tokens ?? 0;
    usage.cache_creation_input_tokens +=
      response.usage?.cache_creation_input_tokens ?? 0;
    usage.cache_read_input_tokens +=
      response.usage?.cache_read_input_tokens ?? 0;
    assistantContent = response.content;
    finalStopReason = response.stop_reason ?? null;

    if (response.stop_reason !== "tool_use") {
      // end_turn or max_tokens — done
      break;
    }

    // Collect tool_use blocks; execute server-side ones; pause on present_choices.
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    if (toolUseBlocks.length === 0) {
      break;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    let sawPresentChoices = false;
    for (const tu of toolUseBlocks) {
      if (tu.name === "present_choices") {
        // Pause the loop. Don't execute — UI renders the buttons.
        const inp = tu.input as Record<string, unknown>;
        pendingChoices = {
          question: String(inp.question ?? ""),
          context: inp.context ? String(inp.context) : undefined,
          choices: (inp.choices as PresentChoicesPayload["choices"]) ?? [],
          related_field: inp.related_field
            ? String(inp.related_field)
            : undefined,
          tool_use_id: tu.id,
        };
        sawPresentChoices = true;
        // Stop processing further tool_uses in this response.
        break;
      }
      const result = await executeServerTool(
        input.requestId,
        tu.name,
        tu.input as Record<string, unknown>,
      );
      toolUses.push({
        name: tu.name,
        input: tu.input as Record<string, unknown>,
        result,
      });
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: result.ok ? result.ack : `Error: ${result.error}`,
        is_error: !result.ok,
      });
    }

    if (sawPresentChoices) {
      // Stop the loop. The UI will show buttons; next user turn carries the pick.
      break;
    }

    // Server tools executed — append assistant turn + user tool_results, continue loop.
    messages.push({
      role: "assistant",
      content: assistantContent as Anthropic.ContentBlockParam[],
    });
    messages.push({
      role: "user",
      content: toolResults,
    });
  }

  return {
    assistantContent,
    toolUses,
    pendingChoices,
    finalStopReason,
    usage,
  };
}

/**
 * Streaming variant of runConversationTurn. Behaves identically (same
 * agentic loop, same tool execution, same caching prefix) but emits
 * TurnStreamEvents as it runs — `text-delta` per token chunk,
 * `tool-started/completed` around server-side tool calls, then exactly
 * one terminal event (`done` or `error`).
 *
 * The Route Handler at /api/chat/stream forwards these as SSE.
 */
export async function streamConversationTurn(
  input: {
    requestId: string;
    prior: ConversationMessage[];
    role: ContactRole | null;
    brandName: string | null;
    contactName: string | null;
    materialsContext: MaterialsContext;
    answers: Record<string, unknown>;
  },
  emit: (event: TurnStreamEvent) => void,
): Promise<void> {
  let apiKey: string;
  try {
    apiKey = assertEnv("AIBE_ANTHROPIC_API_KEY");
  } catch (err) {
    emit({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
    return;
  }
  const client = new Anthropic({ apiKey });

  const promptParts = buildSystemPromptParts({
    role: input.role,
    materialsContext: input.materialsContext,
    answers: input.answers,
    brandName: input.brandName,
    contactName: input.contactName,
  });
  const system: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: promptParts.stable,
      cache_control: { type: "ephemeral" },
    },
    { type: "text", text: promptParts.dynamic },
  ];

  const messages: Anthropic.MessageParam[] = input.prior.map((m) => ({
    role: m.role,
    content:
      typeof m.content === "string"
        ? m.content
        : (m.content as Anthropic.ContentBlockParam[]),
  }));

  const usage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  };
  const toolUses: ToolUseTrace[] = [];
  let assistantContent: Anthropic.ContentBlock[] = [];
  let finalStopReason: string | null = null;
  let pendingChoices: PresentChoicesPayload | null = null;

  try {
    for (let iteration = 0; iteration < MAX_LOOP_ITERATIONS; iteration++) {
      emit({ type: "iteration-start", iteration });

      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        tools: TOOLS,
        messages,
      });

      // Forward incremental text deltas to the client.
      stream.on("text", (delta) => {
        if (delta) emit({ type: "text-delta", delta });
      });

      const finalMessage = await stream.finalMessage();
      usage.input_tokens += finalMessage.usage?.input_tokens ?? 0;
      usage.output_tokens += finalMessage.usage?.output_tokens ?? 0;
      usage.cache_creation_input_tokens +=
        finalMessage.usage?.cache_creation_input_tokens ?? 0;
      usage.cache_read_input_tokens +=
        finalMessage.usage?.cache_read_input_tokens ?? 0;
      assistantContent = finalMessage.content;
      finalStopReason = finalMessage.stop_reason ?? null;

      if (finalMessage.stop_reason !== "tool_use") {
        break;
      }

      const toolUseBlocks = finalMessage.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );
      if (toolUseBlocks.length === 0) break;

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      let sawPresentChoices = false;
      for (const tu of toolUseBlocks) {
        if (tu.name === "present_choices") {
          const inp = tu.input as Record<string, unknown>;
          pendingChoices = {
            question: String(inp.question ?? ""),
            context: inp.context ? String(inp.context) : undefined,
            choices: (inp.choices as PresentChoicesPayload["choices"]) ?? [],
            related_field: inp.related_field
              ? String(inp.related_field)
              : undefined,
            tool_use_id: tu.id,
          };
          emit({ type: "present-choices", payload: pendingChoices });
          sawPresentChoices = true;
          break;
        }

        emit({ type: "tool-started", name: tu.name });
        const result = await executeServerTool(
          input.requestId,
          tu.name,
          tu.input as Record<string, unknown>,
        );
        emit({
          type: "tool-completed",
          name: tu.name,
          ok: result.ok,
          ack: result.ok ? result.ack : undefined,
        });
        toolUses.push({
          name: tu.name,
          input: tu.input as Record<string, unknown>,
          result,
        });
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: result.ok ? result.ack : `Error: ${result.error}`,
          is_error: !result.ok,
        });
      }

      if (sawPresentChoices) break;

      messages.push({
        role: "assistant",
        content: assistantContent as Anthropic.ContentBlockParam[],
      });
      messages.push({ role: "user", content: toolResults });
    }

    emit({
      type: "done",
      assistantContent,
      toolUses,
      pendingChoices,
      finalStopReason,
      usage,
    });
  } catch (err) {
    emit({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
