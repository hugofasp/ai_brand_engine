import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { assertEnv } from "@/lib/env";
import { getQuestionsForPhase } from "@/interview/registry";
import { SUPPORTED_LOCALES, type Phase } from "@/interview/types";

const EXTRACTION_MODEL = "claude-sonnet-4-6";

/**
 * Per-question draft. `value` is the actual inferred answer (matches the
 * question's answer shape). `source_quotes` are short verbatim excerpts
 * from the materials so the user can verify the inference. `missing_context`
 * is the depth Claude couldn't infer — things the interview needs that
 * the materials don't reveal. This is what keeps the drawer from being
 * a "click confirm on shallow answers" trap.
 */
const DraftCommonFields = {
  source_quotes: z
    .array(z.string())
    .describe(
      "1-3 short verbatim quotes (each <200 chars) from the materials that support this draft. Use exact words from the source. Empty array if the draft is purely structural inference (e.g. ISO locale from a .pt domain).",
    ),
  missing_context: z
    .array(z.string())
    .describe(
      "2-5 specific things the interview needs about this question that the materials don't reveal. Each item is a question or prompt the user should answer — concrete, not generic. e.g. 'Is the consultancy founder-led or staffed with associates?' not 'tell us more about your team'.",
    ),
};

function buildExtractionSchema() {
  return z.object({
    drafts: z.object({
      q1_1: z
        .object({
          value: z.object({
            brand_name: z.string().nullable(),
            locale_primary: z.string().nullable(),
            locale_secondary: z.string().nullable(),
          }),
          ...DraftCommonFields,
        })
        .nullable(),
      q1_3: z
        .object({
          value: z.object({
            name: z.string().nullable(),
            type: z.string().nullable(),
            structure: z.string().nullable(),
            focus: z.string().nullable(),
            region: z.string().nullable(),
            specialization: z.string().nullable(),
          }),
          ...DraftCommonFields,
        })
        .nullable(),
      q1_7: z
        .object({
          value: z.object({
            category: z.string().nullable(),
          }),
          ...DraftCommonFields,
        })
        .nullable(),
      q1_10: z
        .object({
          value: z.array(z.string()),
          ...DraftCommonFields,
        })
        .nullable(),
    }),
    summary: z.string(),
  });
}

export type ExtractedDraft = {
  value: unknown;
  source_quotes: string[];
  missing_context: string[];
};

export type ExtractionResult = {
  drafts: Record<string, ExtractedDraft>;
  summary: string;
  model: string;
  attempted_questions: string[];
  succeeded_questions: string[];
  empty_questions: string[];
  /** Anthropic token usage for this extraction call. */
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
};

export async function extractDrafts(input: {
  pasted_text?: string;
  /**
   * Pages crawled from the brand's domain. Each page contributes its
   * Readability-extracted main content; the prompt sees them in order
   * (homepage first).
   */
  crawled_pages?: Array<{ url: string; title: string; text: string }>;
  /**
   * LinkedIn company URLs found anywhere on the user's website. Persisted
   * in materials_context for future use (v2 paid scrapers — see
   * DESIGN_NOTES.md DN-002). Not consumed by extraction in v1 beta; the
   * crawler still collects them so we don't need a data migration later.
   */
  linkedin_urls?: string[];
  /**
   * Concatenated text extracted from client-uploaded files (PDF / DOCX /
   * TXT / MD) in the materials phase. Already sanitized and capped per
   * file. Treated as complementary context to the website crawl + paste.
   */
  uploaded_text?: string;
}): Promise<
  | { ok: true; result: ExtractionResult }
  | { ok: false; error: string }
> {
  const apiKey = assertEnv("AIBE_ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });

  const extractables: Array<{ id: string; hint: string; prompt: string }> = [];
  for (const p of [1, 2, 3, 4, 5, 6, 7] as Phase[]) {
    for (const q of getQuestionsForPhase(p)) {
      if (q.extractable && q.extractionHint) {
        extractables.push({
          id: q.id,
          hint: q.extractionHint,
          prompt: q.prompt,
        });
      }
    }
  }

  if (extractables.length === 0) {
    return { ok: false, error: "No questions tagged as extractable." };
  }

  const websiteBlock =
    input.crawled_pages && input.crawled_pages.length > 0
      ? input.crawled_pages
          .map(
            (p, i) =>
              `--- PAGE ${i + 1}: ${p.url}${p.title ? ` ("${p.title}")` : ""} ---\n${p.text}`,
          )
          .join("\n\n")
      : null;

  const materialsBlock = [
    websiteBlock
      ? `--- BEGIN WEBSITE (${input.crawled_pages!.length} page${input.crawled_pages!.length === 1 ? "" : "s"}) ---\n\n${websiteBlock}\n\n--- END WEBSITE ---`
      : null,
    input.pasted_text
      ? `--- BEGIN PASTED TEXT ---\n${input.pasted_text}\n--- END PASTED TEXT ---`
      : null,
    input.uploaded_text
      ? `--- BEGIN UPLOADED FILES ---\n${input.uploaded_text}\n--- END UPLOADED FILES ---`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (!materialsBlock.trim()) {
    return { ok: false, error: "No materials provided." };
  }

  const questionInstructions = extractables
    .map(
      (q) =>
        `[${q.id}]\nQuestion: ${q.prompt}\nExtraction guidance: ${q.hint}`,
    )
    .join("\n\n");

  const allowedLocales = SUPPORTED_LOCALES.map((l) => l.value).join(", ");

  const system = `You are an extraction agent for brand.soul OS — a platform that produces brand-reasoning files for LLMs. The interview drafts you produce will be shown to brand owners as starting points; they MUST edit them. Your job is to give them a foothold, not a finished answer.

OUTPUT DISCIPLINE (read carefully — getting this wrong creates worse outcomes than returning null):

1. **Reject single-noun and label-only drafts.** "consultancy", "agency", "B2B SaaS" — these are too thin to be useful. If your draft for a text field would be a single noun or fewer than 4 words, return null for the whole question. The interview is asking for structural depth; a one-word draft trains the user to ship one-word answers.

2. **Sentence-level minimum.** Where the answer shape allows a sentence, write one. Where it's a record of short fields (name, type, structure, focus, region, specialization), each filled field should be specific and concrete — not a category name.

3. **Source quotes are mandatory when you make an inference.** Every non-null draft MUST include 1-3 verbatim short quotes from the materials in source_quotes. Exact words from the source. The exception is purely structural inferences (e.g., ISO locale from a .pt domain) — those can have an empty array.

4. **Always populate missing_context.** Even when you produce a strong draft, the interview needs more than the materials can provide. List 2-5 specific prompts for the user to answer — concrete, not generic. "What is the mechanism behind your repositioning service — interview-based, audit-based, workshop-based?" — not "tell us about your services". These items become a checklist the user works through.

5. **Never invent facts. Extrapolate to structural claims ONLY with converging evidence.** The materials may state real facts (a name, a title, a partner relationship) that do NOT, on their own, license structural inferences about the company. Structural claims require two-source evidence — at least one explicit headcount or org-shape signal from a verifiable source, ALONGSIDE the biographical signal.

    DEFAULT — single-signal facts that do NOT license structural inference:
    - "Jane Smith, CEO and Founder" alone does NOT license "Founder-led" — the founder may have stepped aside, the org may be 200 people, the title may be honorary.
    - "we work with trusted partners" alone does NOT license "partnership-based" or "boutique".
    - "our team believes" alone does NOT license team size, structure, or composition.
    - "founded in 2020" alone does NOT license "early-stage" or "growing".
    - Marketing words ("boutique", "agile", "lean", "scrappy") are aspirational, not structural — never adopt them unless the materials use the literal word AS a self-description AND headcount evidence corroborates.

    CONDITIONAL EXCEPTION — structural inference IS licensed when you have headcount evidence. Headcount can come from:
    - A team / people / about page on the website listing the actual roster (named individuals)
    - Direct text in the materials ("we are a 5-person studio", "two founders")
    - Press releases or case studies mentioning team size

    With headcount evidence in hand, the inference rules:
    - **1-10 employees AND a founder named in materials** → "founder-led" / "small team" / "boutique" is LICENSED. Include the headcount source in source_quotes.
    - **11-50 employees** → "small firm" allowed. "founder-led" NOT licensed unless the materials say so explicitly.
    - **51+ employees** → no structural inference of size from biographical signals at all.
    - **No headcount evidence found** → structure field is null. Add the gap to missing_context.

    Every word in the value must be traceable either to explicit statements in the materials or to headcount-licensed inference. If a word lacks support, strike it. Null > inferred-without-evidence.

6. **Case-study and project pages describe CLIENTS, not the agency.** When the crawler returns pages like /project/*, /work/*, /case-studies/*, treat their content as evidence of what the agency DOES (outcomes, sectors served) — never as evidence of what the agency IS (its structure, its team, its identity). A byline on a case study ("Leon Rowley led this project") tells you a name exists but tells you nothing about the agency's organizational form.

7. **Cliché marketing language must be distilled or omitted.** Don't launder cliché phrasing into your draft, even when the source uses it. Banned in your drafts: "innovative", "cutting-edge", "transform", "unlock", "reimagine", "seamless", "journey", "leverage", "end-to-end", "holistic", "synergy", "foster", "fuel", "ignite", "paradigm shift", "game-changer", "leader in", "leading", "comprehensive", "world-class", "best-in-class", "next-generation", "revolutionary", "groundbreaking", "disrupt(ive)". When the brand uses these in source materials, distill the underlying structural claim or omit. Do NOT borrow these words even when they appear verbatim in source_quotes — the quote can include them, but your value field cannot.

8. **Locale codes are ISO 639-1.** Only emit codes from this set: ${allowedLocales}. For locale_secondary, return a single ISO code or null. The interview lets the user add more later.

9. **Honesty over completeness.** A null draft on a question where the materials are weak is better than a laundered draft. Returning null tells the user "you'll need to write this fresh" — which is the truth.

HEADCOUNT EVIDENCE — look ONLY in the website content provided. You do NOT have web tools available.

Things that count as headcount evidence in the materials:
  - A "Team" / "People" / "Our team" page listing named individuals — count them.
  - About copy saying "we are a 5-person studio", "our team of 12", "two founders", etc.
  - Press releases or case studies mentioning team size.
  - Multiple distinct named roles (founder, CEO, designer, strategist, etc.) — weak signal but contributes.

If the website provides no concrete headcount signal: treat headcount as unknown. Structure stays null. Add the gap to missing_context. Do not attempt to infer headcount from biographical mentions of a founder/CEO — that's the failure mode worked counter-examples below.

When you find evidence, include the verbatim source in source_quotes:
  - "Our team page lists 4 people: Leon, Maria, Pedro, Ana"
  - "we are a five-person studio"
  - "founded by Anna and Pedro in 2019" (only licenses two-person inference if paired with no other team mentions across the materials)

WORKED COUNTER-EXAMPLES (these would be REJECTED if you produced them):

✗ "Founder-led boutique with a named CEO and a network of trusted financial and execution partners"
  → Why rejected: "Founder-led" and "boutique" are inferred from a single name/title on a case study, not stated in the materials. "Network of partners" is true but doesn't define structure.
  → Correct response: null for the structure field. Move "How is the company structured — sole-founder, partnership, registered company?" into missing_context.

✗ "A small, agile team of strategists and designers"
  → Why rejected: Materials never say "small" or "agile" or describe team composition. "Strategists and designers" is inferred from service descriptions.
  → Correct response: null. Missing_context: "What is the team size, and what disciplines are represented?"

✗ Type: "consultancy" (single noun — too thin)
  ✓ Type: "Strategic transformation advisory firm serving growing companies" (sentence-grade, traceable to "Strategic Transformation for Growing Companies" tagline)

DRAFT SHAPE PER QUESTION:
- value: the inferred answer matching the question's structure. null any sub-field you can't fill.
- source_quotes: 1-3 short verbatim excerpts. Every key term in your draft must appear in or be directly paraphrased from these quotes. If a quote doesn't support a specific word in your draft, the draft has overreached — strike that word.
- missing_context: 2-5 specific items the user must add to make this answer complete.

The "drafts" object MUST contain a key for every question listed below. If extraction failed entirely for a question, set its value to null.

ALSO return a one-paragraph 'summary' describing what you saw in the materials and which fields were strong vs. weak. This is shown to the user so they understand where drafts came from.

Questions to extract:

${questionInstructions}`;

  // v1 beta: website crawl only — no remote tool calls. The crawler still
  // collects LinkedIn URLs into materials_context for future v2 (when paid
  // scrapers like Proxycurl land), but we don't pass them to Claude here
  // because there's no tool wired to act on them. Keeping them out of the
  // user prompt saves tokens and prevents Claude from inventing structural
  // claims from a URL slug.
  const userPrompt = `Materials for the brand interview.\n\n${materialsBlock}\n\nProduce drafts per the rules above. JSON exactly matching the schema.`;

  try {
    const response = await client.messages.parse({
      model: EXTRACTION_MODEL,
      max_tokens: 8192,
      thinking: { type: "disabled" },
      system,
      messages: [{ role: "user", content: userPrompt }],
      output_config: {
        format: zodOutputFormat(buildExtractionSchema()),
      },
      // v1 beta: no remote tools. Empirically web_search on LinkedIn
      // cost ~$0.20 per extraction and produced no useful headcount
      // evidence in testing — search disambiguation poor, LinkedIn often
      // doesn't show public employee ranges anyway. Conservative
      // website-only path delivers $0.034 per extraction with the same
      // null fallback when evidence is thin. v2 picks this up via paid
      // scrapers (Proxycurl) — see DESIGN_NOTES.md DN-002.
    });

    const parsed = response.parsed_output;
    if (!parsed) {
      return {
        ok: false,
        error: "Claude returned a response but it didn't match the schema.",
      };
    }

    const drafts: Record<string, ExtractedDraft> = {};
    const succeeded: string[] = [];
    const empty: string[] = [];
    const rawDrafts = parsed.drafts as Record<string, ExtractedDraft | null>;
    for (const q of extractables) {
      const d = rawDrafts[q.id];
      if (d === null || d === undefined) {
        empty.push(q.id);
      } else {
        drafts[q.id] = d;
        succeeded.push(q.id);
      }
    }

    return {
      ok: true,
      result: {
        drafts,
        summary: parsed.summary,
        model: EXTRACTION_MODEL,
        attempted_questions: extractables.map((q) => q.id),
        succeeded_questions: succeeded,
        empty_questions: empty,
        usage: {
          input_tokens: response.usage?.input_tokens ?? 0,
          output_tokens: response.usage?.output_tokens ?? 0,
          cache_creation_input_tokens:
            response.usage?.cache_creation_input_tokens ?? 0,
          cache_read_input_tokens:
            response.usage?.cache_read_input_tokens ?? 0,
        },
      },
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Claude API error: ${err.message}`
          : String(err),
    };
  }
}
