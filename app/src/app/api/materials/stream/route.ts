import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { crawlDomain, type CrawlEvent } from "@/lib/materials/crawl-domain";
import { extractDrafts } from "@/lib/materials/extract-drafts";
import { sanitizeBrandValue, sanitizeBrandText } from "@/lib/text/sanitize";
import type {
  MaterialsContext,
  DraftEntry,
} from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Crawl + extraction can take 30-90s on a real site. */
export const maxDuration = 300;

/* ------------------------------------------------------------------ *
 *  SSE event types                                                    *
 * ------------------------------------------------------------------ */

export type MaterialsStreamEvent =
  | {
      type: "started";
      sources: { website: boolean; paste: boolean; uploads: number };
      url?: string;
    }
  | { type: "crawl-entry"; url: string; title: string }
  | { type: "crawl-page"; url: string; title: string; index: number }
  | { type: "crawl-skipped"; url: string; reason: string }
  | { type: "linkedin-found"; url: string }
  | { type: "crawl-done"; pageCount: number; linkedinCount: number }
  | {
      type: "uploads-included";
      count: number;
      total_chars: number;
    }
  | { type: "extract-started" }
  | {
      type: "draft-ready";
      questionId: string;
      label: string;
      preview: string;
    }
  | {
      type: "extract-done";
      summary: string;
      succeededCount: number;
      emptyCount: number;
    }
  | { type: "persisted" }
  | { type: "final"; redirectTo: string }
  | { type: "error"; message: string };

/* ------------------------------------------------------------------ *
 *  POST /api/materials/stream                                         *
 *                                                                     *
 *  Body: { requestId, mode: "website", url } | { requestId, mode:    *
 *  "pasted_text", pasted_text }                                       *
 *                                                                     *
 *  Streams MaterialsStreamEvent JSON as SSE so the materials page can *
 *  show the pipeline live (pages being read, LinkedIn URLs found,     *
 *  drafts surfacing one at a time).                                   *
 * ------------------------------------------------------------------ */

export async function POST(request: Request) {
  // Rate limit: materials extraction is the most expensive endpoint
  // (full domain crawl + Claude extraction). 8 runs / minute / IP is
  // far above legitimate use and far below the budget Anthropic spend
  // bracket we tolerate per minute.
  const rl = (await import("@/lib/rate-limit")).enforceRateLimit(
    request,
    "materials-stream",
  );
  if (rl) return rl;

  // New input shape supports ANY combination of three sources:
  // website URL, pasted text, and previously-uploaded files (referenced
  // by id; their text was extracted at upload time and stored in
  // materials_context.uploaded_text). The legacy `mode` field is also
  // honoured for backwards compatibility.
  const body = (await request.json().catch(() => null)) as
    | {
        requestId?: string;
        url?: string;
        pasted_text?: string;
        /** When true, include the materials_context.uploaded_text
         * already on the row in the extraction prompt. */
        include_uploads?: boolean;
        /** Legacy shim — older callers may still send mode. */
        mode?: "website" | "pasted_text";
      }
    | null;
  if (!body || !body.requestId) {
    return new Response(JSON.stringify({ error: "Missing requestId." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const requestId = body.requestId;
  const inputUrl = body.url?.trim() || undefined;
  const inputText = body.pasted_text?.trim() || undefined;
  const includeUploads = body.include_uploads !== false; // default true

  // We need at least ONE source — but the validator that catches
  // "nothing at all was provided" runs after we've loaded the row, so
  // we can check against uploaded_files too.

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: MaterialsStreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          // client disconnected
        }
      };
      // Keep-alive comment every 15s to defeat idle-connection timeouts.
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        } catch {
          // already closed
        }
      }, 15_000);

      try {
        // Pre-flight: load existing materials_context so we can fold
        // uploaded_text into the extraction prompt.
        const supabasePre = getSupabaseAdmin();
        const { data: rowPre } = await supabasePre
          .from("interview_answers")
          .select("materials_context")
          .eq("request_id", requestId)
          .maybeSingle();
        const ctxPre =
          (rowPre?.materials_context as MaterialsContext | undefined) ?? {};
        const uploadsText = includeUploads ? (ctxPre.uploaded_text ?? "") : "";
        const uploadsCount = includeUploads
          ? (ctxPre.uploaded_files?.length ?? 0)
          : 0;

        // Hard floor: at least one source must be present.
        if (!inputUrl && !inputText && !uploadsText) {
          send({
            type: "error",
            message:
              "No sources provided. Add a website URL, pasted text, or at least one file.",
          });
          return;
        }

        send({
          type: "started",
          sources: {
            website: Boolean(inputUrl),
            paste: Boolean(inputText),
            uploads: uploadsCount,
          },
          url: inputUrl,
        });

        // 1) Crawl (only when a URL was supplied).
        let crawled: Array<{ url: string; title: string; text: string }> = [];
        let crawlOrigin: string | null = null;
        let linkedinUrls: string[] = [];

        if (inputUrl) {
          const crawl = await crawlDomain(inputUrl, (e: CrawlEvent) => {
            switch (e.type) {
              case "entry-fetched":
                send({
                  type: "crawl-entry",
                  url: e.url,
                  title: e.title,
                });
                break;
              case "page-found":
                send({
                  type: "crawl-page",
                  url: e.url,
                  title: e.title,
                  index: e.index,
                });
                break;
              case "page-skipped":
                send({
                  type: "crawl-skipped",
                  url: e.url,
                  reason: e.reason,
                });
                break;
              case "linkedin-found":
                send({ type: "linkedin-found", url: e.url });
                break;
            }
          });
          if (!crawl.ok) {
            // Soft-degrade: if a website was provided but the crawl
            // failed, surface the reason but DO NOT abort if there are
            // other sources to work with.
            if (!inputText && !uploadsText) {
              send({ type: "error", message: crawl.error });
              return;
            }
          } else if (crawl.pages.length === 0) {
            // Same soft-degrade for "site responded but nothing useful".
            if (!inputText && !uploadsText) {
              send({
                type: "error",
                message: "Couldn't read any pages from this site.",
              });
              return;
            }
          } else {
            crawled = crawl.pages;
            crawlOrigin = crawl.origin;
            linkedinUrls = crawl.linkedin_urls;
            send({
              type: "crawl-done",
              pageCount: crawled.length,
              linkedinCount: linkedinUrls.length,
            });
          }
        }

        if (uploadsText) {
          send({
            type: "uploads-included",
            count: uploadsCount,
            total_chars: uploadsText.length,
          });
        }

        // 2) Extract drafts from ALL available sources.
        send({ type: "extract-started" });
        const extraction = await extractDrafts({
          crawled_pages: crawled.length > 0 ? crawled : undefined,
          linkedin_urls: linkedinUrls.length > 0 ? linkedinUrls : undefined,
          pasted_text: inputText,
          uploaded_text: uploadsText || undefined,
        });
        if (!extraction.ok) {
          send({ type: "error", message: extraction.error });
          return;
        }

        // Surface drafts one-by-one with a tiny stagger so the UI can
        // animate them in. The extraction call itself is non-streaming
        // (structured output via tool_use), but spreading the reveal
        // sells the "live thinking" feel without lying.
        for (const qid of extraction.result.succeeded_questions) {
          const draft = extraction.result.drafts[qid];
          send({
            type: "draft-ready",
            questionId: qid,
            label: humanLabelForQuestion(qid),
            preview: shortPreview(draft.value),
          });
          await sleep(140);
        }

        send({
          type: "extract-done",
          summary: extraction.result.summary,
          succeededCount: extraction.result.succeeded_questions.length,
          emptyCount: extraction.result.empty_questions.length,
        });

        // 3) Persist.
        const now = new Date().toISOString();
        const sourceLabelParts: string[] = [];
        if (crawlOrigin)
          sourceLabelParts.push(`your website (${new URL(crawlOrigin).hostname})`);
        if (inputText) sourceLabelParts.push("your pasted context");
        if (uploadsCount > 0)
          sourceLabelParts.push(
            `${uploadsCount} uploaded file${uploadsCount === 1 ? "" : "s"}`,
          );
        const sourceLabel = sourceLabelParts.length
          ? `From ${sourceLabelParts.join(" + ")}`
          : "From your materials";

        const drafts: Record<string, DraftEntry> = {};
        for (const qid of extraction.result.succeeded_questions) {
          const ex = extraction.result.drafts[qid];
          drafts[qid] = {
            // Sanitize every string anywhere inside the draft value tree
            // (em-dashes are forbidden in brand content; sources can
            // carry them in).
            value: sanitizeBrandValue(ex.value),
            source: sourceLabel,
            source_quotes: (ex.source_quotes ?? []).map(sanitizeBrandText),
            missing_context: (ex.missing_context ?? []).map(sanitizeBrandText),
          };
        }
        const materials_context: MaterialsContext = {
          // Preserve any existing uploaded_files / uploaded_text — those
          // are managed by the /api/materials/upload route, not here.
          ...ctxPre,
          url: crawlOrigin ?? ctxPre.url ?? null,
          url_scraped_at: crawlOrigin ? now : (ctxPre.url_scraped_at ?? null),
          url_content: crawlOrigin
            ? crawled
                .map((p) => `[${p.url}] ${p.title}\n${p.text}`)
                .join("\n\n")
            : (ctxPre.url_content ?? null),
          pasted_text: inputText ?? (ctxPre.pasted_text ?? null),
          extracted_at: now,
          extraction_model: extraction.result.model,
          drafts,
          linkedin_urls:
            linkedinUrls.length > 0 ? linkedinUrls : ctxPre.linkedin_urls,
          summary: extraction.result.summary,
        };

        // Token usage merges cumulatively (re-runs add to running total).
        // `ctxPre` was already loaded above, so we don't re-fetch.
        const supabase = getSupabaseAdmin();
        const priorUsage = ctxPre.token_usage ?? {
          input_tokens: 0,
          output_tokens: 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          run_count: 0,
        };
        materials_context.token_usage = {
          input_tokens:
            priorUsage.input_tokens + extraction.result.usage.input_tokens,
          output_tokens:
            priorUsage.output_tokens + extraction.result.usage.output_tokens,
          cache_creation_input_tokens:
            priorUsage.cache_creation_input_tokens +
            extraction.result.usage.cache_creation_input_tokens,
          cache_read_input_tokens:
            priorUsage.cache_read_input_tokens +
            extraction.result.usage.cache_read_input_tokens,
          run_count: priorUsage.run_count + 1,
        };

        const { error: writeErr } = await supabase
          .from("interview_answers")
          .update({ materials_context })
          .eq("request_id", requestId);
        if (writeErr) {
          send({ type: "error", message: writeErr.message });
          return;
        }

        send({ type: "persisted" });
        revalidatePath(`/interview/${requestId}`);

        send({
          type: "final",
          redirectTo: `/interview/${requestId}/chat`,
        });
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
      "X-Accel-Buffering": "no",
    },
  });
}

/* ---------------- helpers ---------------- */

/** Friendly label for a draft, surfaced live as drafts come in. */
function humanLabelForQuestion(qid: string): string {
  const map: Record<string, string> = {
    q1_1: "Brand name and language",
    q1_3: "Company structure",
    q1_4: "The problem you solve",
    q1_5: "How you resolve it",
    q1_7: "Your category",
    q1_8: "What competitors can't do",
    q1_9: "What the brand is not",
    q1_10: "Outcomes for customers",
    q1_11: "One-paragraph distillation",
    q2_1: "Audience insight",
    q3_1: "Pillars",
    q4_1: "Voice descriptors",
  };
  return map[qid] ?? qid;
}

function shortPreview(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return clip(value, 80);
  if (Array.isArray(value)) {
    return clip(value.filter((v) => v != null).map(String).join(", "), 80);
  }
  if (typeof value === "object") {
    const parts: string[] = [];
    for (const [, v] of Object.entries(value as Record<string, unknown>)) {
      if (v == null) continue;
      if (typeof v === "string" && v.trim()) parts.push(v);
      if (parts.length >= 2) break;
    }
    return clip(parts.join(" · "), 80);
  }
  return clip(String(value), 80);
}

function clip(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
