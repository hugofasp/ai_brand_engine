import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { assertEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { expandRegistry, renderFile, FILE_REGISTRY } from "./files";
import {
  buildSynthesisSystemPrefix,
  synthesizeFile,
} from "./synthesize";
import { sanitizeBrandText } from "@/lib/text/sanitize";
import {
  FRAMEWORK_VERSION,
  type AnswersJson,
  type BrandMeta,
  type BrandPackFile,
  type GeneratedFile,
  type RenderContext,
} from "./types";
import type { Phase } from "@/interview/types";
import type { PackIteration } from "@/lib/supabase/types";

/* ------------------------------------------------------------------ *
 *  Streaming events                                                   *
 * ------------------------------------------------------------------ */

export type GenerationEvent =
  | { type: "started"; totalFiles: number }
  | {
      type: "file-started";
      name: string;
      phase: number;
      locale: string | null;
      mode: "template" | "claude";
    }
  | {
      type: "file-done";
      name: string;
      size: number;
      mode: "template" | "claude";
      usage?: {
        input_tokens: number;
        output_tokens: number;
        cache_creation_input_tokens: number;
        cache_read_input_tokens: number;
      };
    }
  | { type: "persisting" }
  | { type: "final"; fileCount: number; framework_version: string }
  | { type: "error"; message: string };

/* ------------------------------------------------------------------ *
 *  Public entry — streaming variant                                    *
 *                                                                     *
 *  Loads answers, renders every file (template OR Claude depending on  *
 *  the registry's `mode`), emits events as work progresses, and at the *
 *  end wipes + reinserts the generated_files rows for this request.    *
 * ------------------------------------------------------------------ */

export async function streamBrandPackGeneration(
  requestId: string,
  emit: (event: GenerationEvent) => void,
  opts: { feedback?: string } = {},
): Promise<void> {
  const feedback = opts.feedback?.trim() || undefined;
  const supabase = getSupabaseAdmin();

  // 1. Load request + answers.
  const { data: request, error: reqErr } = await supabase
    .from("requests")
    .select("company_name, contact_name, contact_email")
    .eq("id", requestId)
    .maybeSingle();
  if (reqErr || !request) {
    emit({
      type: "error",
      message: reqErr?.message ?? "Request not found.",
    });
    return;
  }

  const { data: ansRow, error: ansErr } = await supabase
    .from("interview_answers")
    .select("answers")
    .eq("request_id", requestId)
    .maybeSingle();
  if (ansErr) {
    emit({ type: "error", message: ansErr.message });
    return;
  }
  if (!ansRow) {
    emit({ type: "error", message: "No interview answers found." });
    return;
  }

  const answers = (ansRow.answers as AnswersJson) ?? {};

  // 2. Brand metadata.
  const phase1 =
    (answers.phase_1 as Record<string, unknown> | undefined) ?? {};
  const q1_1 =
    (phase1.q1_1 as Record<string, unknown> | undefined) ?? {};
  const brand: BrandMeta = {
    brand_name:
      (q1_1.brand_name as string) ??
      (request.company_name as string) ??
      "Brand",
    company_name: (request.company_name as string) ?? "",
    contact_name: (request.contact_name as string) ?? null,
    contact_email: (request.contact_email as string) ?? null,
    locale_primary: (q1_1.locale_primary as string) ?? "en",
    locale_secondary:
      (q1_1.locale_secondary as string | null) === ""
        ? null
        : ((q1_1.locale_secondary as string) ?? null),
  };

  // 3. Expand registry against locales.
  const expanded = expandRegistry(brand.locale_primary, brand.locale_secondary);
  emit({ type: "started", totalFiles: expanded.length });

  // 4. Pre-render the voice & lexicon files deterministically. They feed
  //    the Claude synthesis system prefix so the prose files inherit
  //    the brand's voice rules and lexicon.
  const voiceCoreFile = FILE_REGISTRY.find((f) => f.name === "20_VOICE_CORE.txt");
  const lexiconFile = FILE_REGISTRY.find(
    (f) => f.name === "22_LEXICON_[LOCALE].txt",
  );
  const voiceCoreBody = voiceCoreFile
    ? renderFile(voiceCoreFile, { brand, answers })
    : "";
  const locales = [brand.locale_primary, brand.locale_secondary].filter(
    (l): l is string => Boolean(l),
  );
  const lexiconByLocale: Record<string, string> = {};
  if (lexiconFile) {
    for (const locale of locales) {
      lexiconByLocale[locale] = renderFile(lexiconFile, {
        brand,
        answers,
        locale,
      });
    }
  }

  const systemPrefix = buildSynthesisSystemPrefix({
    brandName: brand.brand_name,
    voiceCoreBody,
    lexiconByLocale,
  });

  // Share a single Anthropic client so the SDK can pool connections.
  let claudeClient: Anthropic | null = null;
  function getClient(): Anthropic {
    if (claudeClient) return claudeClient;
    const apiKey = assertEnv("AIBE_ANTHROPIC_API_KEY");
    claudeClient = new Anthropic({ apiKey });
    return claudeClient;
  }

  // 5. Render each file. Order: deterministic first (so we never block
  //    the user behind Claude calls for content that didn't need them);
  //    then Claude-synth files.
  const rendered: GeneratedFile[] = [];
  const ordered = [...expanded].sort((a, b) => {
    const aClaude = (a.file.mode ?? "template") === "claude" ? 1 : 0;
    const bClaude = (b.file.mode ?? "template") === "claude" ? 1 : 0;
    return aClaude - bClaude;
  });

  for (const item of ordered) {
    const ctx: RenderContext = {
      brand,
      answers,
      locale: item.locale ?? undefined,
      feedback,
    };
    const mode = item.file.mode ?? "template";

    emit({
      type: "file-started",
      name: item.name,
      phase: item.file.phase,
      locale: item.locale,
      mode,
    });

    let body: string;
    let usage:
      | {
          input_tokens: number;
          output_tokens: number;
          cache_creation_input_tokens: number;
          cache_read_input_tokens: number;
        }
      | undefined;
    let modelId = "deterministic-template-v1";

    if (mode === "claude" && item.file.synthesisPrompt) {
      const result = await synthesizeFile({
        systemPrefix,
        file: item.file,
        ctx,
        client: getClient(),
      });
      if (!result.ok) {
        emit({ type: "error", message: `${item.name}: ${result.error}` });
        return;
      }
      body = result.body;
      usage = result.usage;
      modelId = "claude-sonnet-4-6-synth-v1";
    } else {
      body = renderFile(item.file, ctx);
    }

    // Hard sanitization pass: em-dashes (and en-dashes outside numeric
    // ranges) are forbidden in any brand output regardless of source.
    // Safety net for fixture data, materials extraction output, and any
    // Claude synthesis that slipped past the prompt rules.
    body = sanitizeBrandText(body);

    const size = Buffer.byteLength(body, "utf8");
    rendered.push({
      name: item.name,
      phase: item.file.phase as Phase | 0,
      locale: item.locale,
      content: body,
      size,
      generationModel: modelId,
      usage:
        usage ?? {
          input_tokens: 0,
          output_tokens: 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
    });
    emit({ type: "file-done", name: item.name, size, mode, usage });
  }

  // 6. Persist. Wipe prior rows first (regeneration is destructive).
  emit({ type: "persisting" });
  await supabase
    .from("generated_files")
    .delete()
    .eq("request_id", requestId);

  const insertRows = rendered.map((f) => ({
    request_id: requestId,
    file_name: f.name,
    storage_path: null,
    file_size_bytes: f.size,
    framework_version: FRAMEWORK_VERSION,
    locale: f.locale,
    status: "generated" as const,
    content: f.content,
    generation_model: f.generationModel,
    token_usage: f.usage,
  }));
  const { error: insertErr } = await supabase
    .from("generated_files")
    .insert(insertRows);
  if (insertErr) {
    emit({ type: "error", message: insertErr.message });
    return;
  }

  // 7. Stamp the request + append an iteration record. Aggregate the
  // per-file usage so the iteration row reflects what this round cost
  // (the cumulative interview_conversation.token_usage is updated by
  // the chat path, not here, so iteration cost is its own line item).
  const iterationUsage = rendered.reduce(
    (acc, f) => ({
      input_tokens: acc.input_tokens + f.usage.input_tokens,
      output_tokens: acc.output_tokens + f.usage.output_tokens,
      cache_creation_input_tokens:
        acc.cache_creation_input_tokens + f.usage.cache_creation_input_tokens,
      cache_read_input_tokens:
        acc.cache_read_input_tokens + f.usage.cache_read_input_tokens,
    }),
    {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    },
  );

  const { data: reqRow } = await supabase
    .from("requests")
    .select("iteration_history")
    .eq("id", requestId)
    .maybeSingle();
  const priorHistory =
    (reqRow?.iteration_history as PackIteration[] | null) ?? [];
  const nextHistory: PackIteration[] = [
    ...priorHistory,
    {
      at: new Date().toISOString(),
      prompt: feedback ?? "",
      file_count: rendered.length,
      token_usage: iterationUsage,
    },
  ];

  await supabase
    .from("requests")
    .update({
      status: "files_generated",
      files_generated_at: new Date().toISOString(),
      iteration_history: nextHistory,
    })
    .eq("id", requestId);

  emit({
    type: "final",
    fileCount: rendered.length,
    framework_version: FRAMEWORK_VERSION,
  });
}

/* ------------------------------------------------------------------ *
 *  Convenience: non-streaming wrapper (collects all events).         *
 *  Kept so server actions that don't want SSE can still invoke this. *
 * ------------------------------------------------------------------ */

export async function generateBrandPack(
  requestId: string,
  opts: { feedback?: string } = {},
): Promise<
  | { ok: true; fileCount: number; framework_version: string }
  | { ok: false; error: string }
> {
  let error: string | null = null;
  let fileCount = 0;
  let frameworkVersion = FRAMEWORK_VERSION;
  await streamBrandPackGeneration(
    requestId,
    (event) => {
      if (event.type === "error") error = event.message;
      if (event.type === "final") {
        fileCount = event.fileCount;
        frameworkVersion = event.framework_version;
      }
    },
    opts,
  );
  if (error) return { ok: false, error };
  return { ok: true, fileCount, framework_version: frameworkVersion };
}

/** Re-export for callers that previously imported the BrandPackFile type. */
export type { BrandPackFile };
