import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { streamConversationTurn, type TurnStreamEvent } from "@/lib/conversational/run-turn";
import type {
  ConversationMessage,
  InterviewConversation,
  MaterialsContext,
  ContactRole,
} from "@/lib/supabase/types";

export const runtime = "nodejs";
// SSE streams must not be buffered or pre-rendered.
export const dynamic = "force-dynamic";
/**
 * A single conversational turn can run multiple Anthropic calls
 * (agentic loop, up to 4 iterations × 10-30s each). Vercel's default
 * function timeout is 10s on Hobby, 60s on Pro — both too short for
 * a deep tool-use loop. 300s leaves headroom for the worst case while
 * still bounded so a hung Anthropic call eventually surfaces as an
 * error to the client instead of a silent connection drop.
 */
export const maxDuration = 300;

/**
 * POST /api/chat/stream
 *
 * Body: { requestId, userText, pickToolUseId? }
 *
 * Returns an SSE stream of TurnStreamEvent JSON messages. The client
 * appends text-delta events to the current assistant message, shows
 * activity indicators on tool-started/completed, and finalizes on
 * `done` (which also carries the final pendingChoices, filledFields,
 * completedPhases for the sidebar).
 *
 * Persistence happens server-side at the END of the turn: we re-read
 * the row's current interview_conversation (executeUpdateFields may
 * have written completed_fields mid-stream), merge in messages + usage,
 * and write back.
 */
export async function POST(request: Request) {
  // Rate limit: chat turns are cheap individually but easy to spam.
  // 40 turns / minute / IP leaves real interviews unbothered while
  // capping any runaway client loop.
  const rl = (await import("@/lib/rate-limit")).enforceRateLimit(
    request,
    "chat-turn",
  );
  if (rl) return rl;

  const body = (await request.json().catch(() => null)) as
    | { requestId?: string; userText?: string; pickToolUseId?: string }
    | null;
  if (!body || !body.requestId || !body.userText?.trim()) {
    return new Response(
      JSON.stringify({ error: "Missing requestId or userText." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const requestId = body.requestId;
  const userText = body.userText;
  const pickToolUseId = body.pickToolUseId;

  // Load context (request row + interview row), create row on first visit.
  const ctx = await loadContextForStream(requestId);
  if (!ctx.ok) {
    return new Response(
      JSON.stringify({ error: ctx.error }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  const conversation = ctx.conversation;
  const prior: ConversationMessage[] = conversation.messages ?? [];
  const nowIso = new Date().toISOString();

  // Append the user's new message (either plain text or a tool_result
  // block when responding to present_choices).
  const userMessage: ConversationMessage = pickToolUseId
    ? {
        role: "user",
        at: nowIso,
        content: [
          {
            type: "tool_result",
            tool_use_id: pickToolUseId,
            content: userText,
          },
        ],
      }
    : { role: "user", at: nowIso, content: userText };
  const updatedPrior = [...prior, userMessage];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: TurnStreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          // Client disconnected mid-stream — fall through.
        }
      };

      // Heartbeat: emit an SSE comment line every 15s so the browser
      // and any intermediary proxies don't time out the connection
      // during the silent stretches between text-delta bursts (when
      // Claude is still computing the next chunk). Comments are
      // ignored by EventSource / fetch-stream parsers, but they keep
      // the socket warm.
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        } catch {
          // already closed
        }
      }, 15_000);

      try {
        let finalEvent: Extract<TurnStreamEvent, { type: "done" }> | null =
          null;
        let errored: string | null = null;

        await streamConversationTurn(
          {
            requestId,
            prior: updatedPrior,
            role: ctx.contactRole,
            brandName: ctx.brandName,
            contactName: ctx.contactName,
            materialsContext: ctx.materialsContext,
            answers: ctx.answers,
          },
          (event) => {
            send(event);
            if (event.type === "done") finalEvent = event;
            if (event.type === "error") errored = event.message;
          },
        );

        if (errored) {
          // Error already forwarded; nothing to persist.
          return;
        }
        if (!finalEvent) {
          send({ type: "error", message: "Turn ended without a final event." });
          return;
        }

        // Persist. Re-read first so we don't clobber executeUpdateFields'
        // mid-stream writes to interview_conversation.completed_fields /
        // archetype_decisions.
        // (finalEvent is narrowed inside the closure but the assignment is
        // analyzed conservatively; alias the value to a const.)
        const done = finalEvent as Extract<TurnStreamEvent, { type: "done" }>;
        const supabase = getSupabaseAdmin();
        const { data: latestRow } = await supabase
          .from("interview_answers")
          .select("interview_conversation, completed_phases")
          .eq("request_id", requestId)
          .maybeSingle();
        const latestConv: InterviewConversation =
          (latestRow?.interview_conversation as
            | InterviewConversation
            | undefined) ?? conversation;

        const assistantMessage: ConversationMessage = {
          role: "assistant",
          at: new Date().toISOString(),
          content: done.assistantContent as unknown[],
          tool_uses: done.toolUses.map((t) => ({
            name: t.name,
            input: t.input,
            result: t.result,
          })),
        };

        const startedAt =
          latestConv.started_at ?? conversation.started_at ?? nowIso;
        const priorUsage = latestConv.token_usage ?? {
          input_tokens: 0,
          output_tokens: 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          turn_count: 0,
        };
        const nextUsage = {
          input_tokens: priorUsage.input_tokens + done.usage.input_tokens,
          output_tokens: priorUsage.output_tokens + done.usage.output_tokens,
          cache_creation_input_tokens:
            priorUsage.cache_creation_input_tokens +
            done.usage.cache_creation_input_tokens,
          cache_read_input_tokens:
            priorUsage.cache_read_input_tokens +
            done.usage.cache_read_input_tokens,
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
          .eq("request_id", requestId);
        if (writeErr) {
          send({ type: "error", message: writeErr.message });
          return;
        }

        revalidatePath(`/interview/${requestId}/chat`);
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        closed = true;
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Some proxies (nginx) buffer SSE by default.
      "X-Accel-Buffering": "no",
    },
  });
}

/* ---------------- internal: context loading ---------------- */

async function loadContextForStream(requestId: string): Promise<
  | {
      ok: true;
      conversation: InterviewConversation;
      answers: Record<string, unknown>;
      materialsContext: MaterialsContext;
      brandName: string | null;
      contactName: string | null;
      contactRole: ContactRole | null;
    }
  | { ok: false; error: string }
> {
  const supabase = getSupabaseAdmin();
  const { data: req, error: reqErr } = await supabase
    .from("requests")
    .select("company_name, contact_name, contact_role")
    .eq("id", requestId)
    .maybeSingle();
  if (reqErr || !req) {
    return { ok: false, error: reqErr?.message ?? "Request not found." };
  }

  const { data: answersRow, error: ansErr } = await supabase
    .from("interview_answers")
    .select("answers, interview_conversation, materials_context")
    .eq("request_id", requestId)
    .maybeSingle();
  if (ansErr) return { ok: false, error: ansErr.message };

  if (!answersRow) {
    const { data: created, error: createErr } = await supabase
      .from("interview_answers")
      .insert({ request_id: requestId })
      .select("answers, interview_conversation, materials_context")
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
      brandName: req.company_name as string,
      contactName: (req.contact_name as string) ?? null,
      contactRole: (req.contact_role as ContactRole) ?? null,
    };
  }

  return {
    ok: true,
    conversation:
      (answersRow.interview_conversation as InterviewConversation) ?? {},
    answers: (answersRow.answers as Record<string, unknown>) ?? {},
    materialsContext:
      (answersRow.materials_context as MaterialsContext) ?? {},
    brandName: req.company_name as string,
    contactName: (req.contact_name as string) ?? null,
    contactRole: (req.contact_role as ContactRole) ?? null,
  };
}
