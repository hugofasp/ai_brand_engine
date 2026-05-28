import "server-only";
import type { Phase } from "@/interview/types";

/** The full answers JSON, keyed by `phase_N`. */
export type AnswersJson = Partial<Record<`phase_${Phase}`, Record<string, unknown>>>;

export type BrandMeta = {
  brand_name: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  locale_primary: string;
  locale_secondary: string | null;
};

export type RenderContext = {
  brand: BrandMeta;
  answers: AnswersJson;
  /** Locale for per-locale files. Undefined for universal files. */
  locale?: string;
  /** Admin-supplied feedback to apply on this regeneration round. When
   * present, Claude-synthesis files receive it as additional context
   * in the synthesis prompt. Template renderers ignore it. */
  feedback?: string;
};

/**
 * Definition of one output file in the brand pack. Universal files
 * (locale === undefined) render once; per-locale files render once per
 * supported locale.
 *
 * Two render modes:
 *  - "template" — deterministic Markdown built from the answers JSON.
 *    Fast, free, but reads like a spec sheet. Used for rule-files
 *    (VOICE_CORE, LEXICON, CHANNEL_SPECS) where the LLM-target output
 *    is intentionally structured.
 *  - "claude" — Claude is given the relevant phase answers + the voice
 *    + lexicon rules and writes the file in the brand's voice. Used
 *    for human-facing prose files (BRAND_CORE, AUDIENCE, PILLARS,
 *    README, USAGE_GUIDE).
 */
export type BrandPackFile = {
  /** File name. For per-locale files, MUST contain "[LOCALE]" which the
   * generator substitutes per supported locale. */
  name: string;
  /** Which phase this file primarily consumes (used for grouping in admin). */
  phase: Phase | 0;
  /** "universal" → one file. "per_locale" → one file per supported locale. */
  scope: "universal" | "per_locale";
  /** Which render path to use. Defaults to "template" for backwards compat. */
  mode?: "template" | "claude";
  /** Render the file body as plain text / markdown (template mode). */
  render: (ctx: RenderContext) => string;
  /** When `mode === "claude"`, this returns the user prompt the model
   * receives — typically a short instruction + the relevant phase
   * answers serialized as JSON. The model produces the file body
   * directly. */
  synthesisPrompt?: (ctx: RenderContext) => string;
};

/** Snapshot of what the generator produced for one file. */
export type GeneratedFile = {
  name: string;
  phase: Phase | 0;
  locale: string | null;
  content: string;
  /** Bytes of UTF-8 content. */
  size: number;
  /** "deterministic-template-v1" or "claude-sonnet-4-6-synth-v1". */
  generationModel: string;
  /** Token usage for synth files. Empty bundle for template files. */
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
};

/** Result of a full pack generation. */
export type GenerationResult =
  | { ok: true; files: GeneratedFile[]; framework_version: string }
  | { ok: false; error: string };

/** Stable string we record per file so admins can see which framework
 * revision produced the pack. Bump when renderers change in
 * non-backwards-compatible ways. */
export const FRAMEWORK_VERSION = "1.0.0-v1";
