import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { assertEnv } from "@/lib/env";
import type { BrandPackFile, RenderContext } from "./types";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;

/**
 * Build the cached voice/lexicon prefix that goes at the head of every
 * synthesis call. Identical across every file rendered in one
 * generation run, so it benefits from prompt caching after the first
 * file lands.
 *
 * Inputs:
 *  - voiceCoreBody: the rendered 20_VOICE_CORE.txt (deterministic)
 *  - lexiconByLocale: rendered 22_LEXICON_<locale>.txt per supported locale
 */
export function buildSynthesisSystemPrefix(opts: {
  brandName: string;
  voiceCoreBody: string;
  lexiconByLocale: Record<string, string>;
}): string {
  const lexBlocks = Object.entries(opts.lexiconByLocale)
    .map(
      ([locale, body]) =>
        `--- LEXICON · ${locale.toUpperCase()} ---\n\n${body}`,
    )
    .join("\n\n");

  return `You are the in-house writer for ${opts.brandName}. Your job: produce ONE Markdown file in this brand's voice from the structural facts the interview captured.

HARD RULES (override your training preferences):

1. **No em-dashes (—).** Use period, comma, parentheses, or hyphen. Forbidden character.
2. **No marketing clichés.** Banned: transform, leader in, innovative, seamless, comprehensive, world-class, best-in-class, next-generation, revolutionary, groundbreaking, leverage, holistic, synergy, unlock, journey, reimagine, end-to-end, cutting-edge, state-of-the-art. Distill the underlying structural mechanism instead.
3. **No invention.** Every claim must trace to the answers JSON provided in the user message. If the answers don't say it, you don't say it.
4. **No biographical → structural extrapolation.** A CEO name doesn't license "founder-led". A team line doesn't license "boutique". Stick to what's explicit.
5. **Use the brand's voice and lexicon (below).** Match the texture, register, signature phrases, and substitutions. This is not an aesthetic preference, it's a contract.
6. **Output format.** Pure Markdown, no code fences around the whole file. Section headings with \`##\`. Lists with \`-\`. No frontmatter. Start with a \`#\` H1 matching the requested title.
7. **Preserve structural facts verbatim where they exist.** Names, numbers, ratios, percentages, conditions — copy them exactly from the answers, don't paraphrase.
8. **Length discipline.** Aim for the natural length the content requires. Don't pad to look comprehensive. Don't truncate to look terse.

VOICE RULES (apply rigorously):

${opts.voiceCoreBody}

LEXICON (use signature phrases, apply substitutions, avoid banned terms):

${lexBlocks}

When the user message arrives, it contains: the file name + title, the required section headings (in order), and the relevant phase answers as JSON. Produce ONLY the file body. Do not preface with "Here is the file…". Do not append commentary. Just the Markdown.`;
}

/**
 * Call Claude to produce one file body. Returns the text + token usage.
 */
export async function synthesizeFile(opts: {
  systemPrefix: string;
  file: BrandPackFile;
  ctx: RenderContext;
  client?: Anthropic;
}): Promise<
  | {
      ok: true;
      body: string;
      usage: {
        input_tokens: number;
        output_tokens: number;
        cache_creation_input_tokens: number;
        cache_read_input_tokens: number;
      };
    }
  | { ok: false; error: string }
> {
  if (!opts.file.synthesisPrompt) {
    return { ok: false, error: `File ${opts.file.name} has no synthesisPrompt.` };
  }

  const apiKey = assertEnv("AIBE_ANTHROPIC_API_KEY");
  const client = opts.client ?? new Anthropic({ apiKey });

  let userPrompt = opts.file.synthesisPrompt(opts.ctx);

  // Iteration feedback: appended as the LAST section in the user
  // message so it overrides earlier instructions if there's a conflict
  // (Claude attends most to the trailing context). Brand rules (no
  // em-dashes, no clichés, etc.) still hold from the cached system
  // prefix — the feedback can adjust prose but not loosen the rules.
  if (opts.ctx.feedback && opts.ctx.feedback.trim().length > 0) {
    userPrompt +=
      "\n\n# Iteration feedback to apply on this regeneration\n\n" +
      "The previous version of this file was reviewed. The reviewer asked for the following changes. Apply them precisely while keeping every brand rule from the system prefix intact:\n\n" +
      opts.ctx.feedback.trim() +
      "\n\nProduce the revised file body now.";
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: "text",
          text: opts.systemPrefix,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

    // Concatenate every text block in the response.
    const body = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n\n")
      .trim();

    return {
      ok: true,
      body: body + "\n",
      usage: {
        input_tokens: response.usage?.input_tokens ?? 0,
        output_tokens: response.usage?.output_tokens ?? 0,
        cache_creation_input_tokens:
          response.usage?.cache_creation_input_tokens ?? 0,
        cache_read_input_tokens: response.usage?.cache_read_input_tokens ?? 0,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
