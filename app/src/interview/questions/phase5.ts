import type { Question } from "../types";

// Phase 5 — Lexicon. Populates 22_LEXICON_[LOCALE].
// All prompt / why / orientative strings verbatim from
// NINEYARDS_INTERVIEW_FULL.md.

export const PHASE_5_QUESTIONS: Question[] = [
  {
    id: "q5_1",
    phase: 5,
    position: 1,
    type: "per_locale_structured_list",
    prompt:
      "What 5-15 phrases does your brand own — phrases unique enough that when someone reads them, they recognize you?",
    why:
      "Signature phrases are the brand's most owned vocabulary. They show up as anchors in voice samples and high-recall content moments.",
    orientative:
      "Signature phrases are recognizable. 'Cost does not surprise. It accumulates.' is signature — it's specific enough to belong to one brand. 'Quality and innovation' is not. If your phrase could appear in any brand's marketing, it's not signature.",
    tags: ["lexicon", "signature_phrases", "per_locale", "brand_owned"],
    fieldKey: "signature_phrases",
    variant: "list",
    constraints: { min: 5, max: 15, itemMaxLength: 120, required: true },
    itemPlaceholder: "A signature phrase your brand owns",
  },

  {
    id: "q5_2",
    phase: 5,
    position: 2,
    type: "per_locale_structured_list",
    prompt:
      "What 10-20 X-not-Y vocabulary preferences does your brand have? Words you specifically use, instead of common alternatives.",
    why:
      "Per-locale substitutions become hard rules in the lexicon file. The framework rewrites drafts to use the brand's preferred terms.",
    orientative:
      "Example pairs: 'system not solution', 'mechanism not approach', 'client not customer', 'unit not home'. These are small choices, but consistency across them creates a recognizable lexicon.",
    tags: ["lexicon", "substitutions", "per_locale"],
    fieldKey: "preferred_substitutions",
    variant: "structured_list",
    constraints: { min: 5, max: 25, required: true },
    itemFields: [
      {
        key: "use",
        label: "Use this",
        type: "short_text",
        maxLength: 50,
        required: true,
      },
      {
        key: "instead_of",
        label: "Instead of",
        type: "short_text",
        maxLength: 50,
        required: true,
      },
    ],
  },

  {
    id: "q5_3",
    phase: 5,
    position: 3,
    type: "multi_field_select_group",
    prompt:
      "Any locale-specific punctuation or formatting preferences? Quotation marks (\"\" vs «» vs „\"), spacing conventions, list formatting, etc.",
    why:
      "Different languages have different conventions. Setting your brand's choice now prevents the LLM from defaulting to the wrong locale's punctuation.",
    orientative:
      "Different languages have different conventions. Portuguese uses «» quote marks in some contexts. Spanish uses inverted question marks. Specify your brand's choices.",
    tags: ["lexicon", "punctuation", "per_locale"],
    fields: [
      {
        key: "quotation_marks",
        label: "Quotation marks",
        options: [
          { value: "double", label: "\"…\" (double)" },
          { value: "angle", label: "«…» (angle / guillemets)" },
          { value: "german", label: "„…\" (German low/high)" },
          { value: "mixed", label: "Mixed" },
          { value: "other", label: "Other" },
        ],
      },
    ],
  },

  {
    id: "q5_4",
    phase: 5,
    position: 4,
    type: "per_locale_structured_list",
    prompt:
      "Beyond the universal blocklist (English AI clichés) and the native AI defaults, are there words or phrases specific to your brand or industry that you ban? Show each with an example of bad usage and a rewrite.",
    why:
      "Industry-specific clichés (real estate 'luxury', tech 'frictionless') don't always trigger the universal blocklist. This is where the brand owner adds their own rules.",
    orientative:
      "These are industry-specific or brand-specific clichés. In real estate: 'luxury', 'exclusive', 'discerning buyers'. In tech: 'frictionless', 'AI-powered', 'next-generation'. List what's specific to your context.",
    tags: ["lexicon", "blocklist", "per_locale", "brand_specific"],
    fieldKey: "brand_specific_blocklist",
    variant: "structured_list",
    optional: true,
    constraints: { min: 0, max: 30 },
    itemFields: [
      {
        key: "term",
        label: "Term",
        type: "short_text",
        maxLength: 50,
        required: true,
      },
      {
        key: "bad_example",
        label: "Bad example",
        type: "long_text",
        maxLength: 200,
        required: true,
      },
      {
        key: "why_it_fails",
        label: "Why it fails",
        type: "short_text",
        maxLength: 150,
        required: true,
      },
      {
        key: "better_version",
        label: "Better version",
        type: "long_text",
        maxLength: 200,
        required: true,
      },
    ],
  },
];
