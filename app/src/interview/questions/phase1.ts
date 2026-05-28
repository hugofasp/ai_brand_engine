import type { Question } from "../types";
import { CHANNELS, SUPPORTED_LOCALES } from "../types";

// Phase 1 — Foundation. Populates 10_BRAND_CORE.
// All prompt / why / orientative strings verbatim from
// NINEYARDS_INTERVIEW_FULL.md.

export const PHASE_1_QUESTIONS: Question[] = [
  {
    id: "q1_1",
    phase: 1,
    position: 1,
    type: "multi_field_group",
    extractable: true,
    extractionHint:
      "From the website/materials, extract the brand's display name. For locale_primary, ALWAYS prioritize the language the actual page content is written in over the domain TLD. A `.pt` domain with English-only copy is `en`, not `pt`. A `.com` site in Portuguese is `pt`. Read the actual prose. Domain TLDs are unreliable. For locale_secondary, leave null unless the site clearly has a language switcher or content in a second language. Output ISO 639-1 codes (en, pt, es, fr, etc.).",
    prompt:
      "What's the brand called, and in which language(s) does it operate?",
    why:
      "Anchors every other answer. Drives file naming, locale-specific files, and the system check output.",
    orientative:
      "Primary language is what you operate in most. Other supported languages should be added only if you'll actually create content in them — not aspirationally. Each additional language doubles roughly four files of work.",
    tags: ["foundation", "locale_config", "mandatory"],
    fields: [
      {
        key: "brand_name",
        label: "Brand name",
        placeholder: "Your brand name",
        maxLength: 120,
        required: true,
      },
      {
        key: "locale_primary",
        label: "Primary language",
        placeholder: "e.g. en",
        maxLength: 2,
        required: true,
      },
      {
        key: "locale_secondary",
        label: "Secondary languages (comma-separated, ISO codes; optional)",
        placeholder: "e.g. pt, es",
        maxLength: 30,
      },
    ],
  },

  {
    id: "q1_2",
    phase: 1,
    position: 2,
    type: "channel_locale_defaults",
    prompt:
      "Do any of your channels always operate in a specific language, regardless of who's writing them?",
    why:
      "Some brands have stable per-channel locale patterns (e.g., Portuguese brand whose LinkedIn is always in English). Without this, the system infers locale from the staff member's prompt language, which can be wrong.",
    orientative:
      "If you don't have hard rules here, leave them as 'follows prompt' — the system handles it via inference. Only set channel defaults when you really mean 'this channel is always in language X'.",
    tags: ["foundation", "locale_config", "optional"],
    optional: true,
    channels: [...CHANNELS],
    showWhen: (answers) => {
      const phase1 = (answers["phase_1"] ?? {}) as Record<string, unknown>;
      const q1_1 = (phase1.q1_1 ?? {}) as Record<string, unknown>;
      const sec = q1_1.locale_secondary;
      if (Array.isArray(sec)) return sec.length > 0;
      if (typeof sec === "string") return sec.trim().length > 0;
      return false;
    },
  },

  {
    id: "q1_3",
    phase: 1,
    position: 3,
    type: "multi_field_group",
    extractable: true,
    extractionHint:
      "From the materials, extract structural facts about the company: type (e.g., 'Housing Production Platform', 'Brand Consultancy', 'SaaS Platform'), structure (e.g., 'Vertically Integrated', 'Studio', 'Agency'), focus (the specific area/product/service), region (where they operate), specialization (their distinctive technical or methodological approach). Use the language of the company's own 'About' page, but strip marketing adjectives — favor regulatory-filing or Wikipedia-infobox style. If a field isn't inferable, leave it empty.",
    prompt:
      "Describe what your brand actually is, structurally. We're not looking for marketing language — we want the operational truth. What type of organization is it? How is it structured? What does it focus on? Where does it operate? What's its specialization?",
    why:
      "The brand's \"physical\" definition — what it does in the world, not how it presents itself. Used for off-domain detection and as the substrate for proposal evaluation in ANALYTICAL_MODE.",
    orientative:
      "Avoid 'we're a leader in...' or 'we specialize in delivering...'. Aim for the kind of definition you'd put in a regulatory filing or a wikipedia infobox. Concrete, structural, factual.",
    tags: ["foundation", "entity", "mandatory", "mechanism_test"],
    fields: [
      {
        key: "name",
        label: "Name",
        placeholder: "Defaults to the brand name from Q1.1",
        maxLength: 120,
        defaultFromQuestion: "q1_1.brand_name",
        required: true,
      },
      {
        key: "type",
        label: "Type",
        placeholder: "e.g., Housing Production Platform",
        maxLength: 120,
        required: true,
      },
      {
        key: "structure",
        label: "Structure",
        placeholder: "e.g., Vertically Integrated Developer",
        maxLength: 120,
        required: true,
      },
      {
        key: "focus",
        label: "Focus",
        placeholder: "e.g., Residential Communities",
        maxLength: 120,
        required: true,
      },
      {
        key: "region",
        label: "Region",
        placeholder: "e.g., Portugal",
        maxLength: 120,
        required: true,
      },
      {
        key: "specialization",
        label: "Specialization",
        placeholder: "e.g., Modern Methods of Construction (MMC)",
        maxLength: 200,
        required: true,
      },
    ],
    rejectPhrases: [
      "leader in",
      "specialist in delivering",
      "innovative",
      "cutting-edge",
      "best-in-class",
    ],
    rejectMessage:
      "That sounds aspirational. What does the company do in concrete terms?",
  },

  {
    id: "q1_4",
    phase: 1,
    position: 4,
    type: "multi_field_group",
    prompt:
      "What problem does your brand exist to solve, and what specifically causes that problem? We want the mechanisms — the specific reasons the problem exists — not the symptoms.",
    why:
      "The thesis is the brand's central argument. It drives every pillar, every contradiction, every analytical-mode response.",
    orientative:
      "Most brands get this wrong by stating the problem as a feeling ('housing is unaffordable'). We want mechanisms. Not 'housing is expensive' but 'housing is expensive because production is fragmented, design is non-standardized, and intermediary margins stack.' Each cause should be something you could point to in the world.",
    tags: ["foundation", "thesis", "mandatory", "mechanism_test"],
    fields: [
      {
        key: "problem",
        label: "Problem (one sentence)",
        placeholder: "State the core problem your brand exists to address",
        maxLength: 200,
        required: true,
      },
    ],
    // NOTE: q1_4 also captures `causes` as a list — encoded as q1_4b below.
  },

  {
    id: "q1_4b",
    phase: 1,
    position: 5,
    type: "list_input",
    prompt:
      "List the specific causes of that problem. Each should be a mechanism — something concrete that happens — not a symptom.",
    why:
      "The mechanisms behind the problem are what your brand's resolution actually addresses. They drive Q1.5 and ripple into every pillar.",
    orientative:
      "Not 'housing is expensive' but 'housing is expensive because production is fragmented, design is non-standardized, and intermediary margins stack.' 3–5 items.",
    tags: ["foundation", "thesis", "mandatory", "mechanism_test"],
    constraints: { min: 3, max: 5, itemMaxLength: 120, required: true },
    itemPlaceholder: "A specific mechanism that causes the problem",
  },

  {
    id: "q1_5",
    phase: 1,
    position: 6,
    type: "short_text",
    prompt:
      "How does your brand resolve that problem? Not 'we make it better' — what's the specific approach? What does your brand do that addresses each of the causes you just named?",
    why:
      "The resolution is the bridge from problem to brand. It tells the system what the brand's intervention is.",
    orientative:
      "If the causes were specific mechanisms, the resolution should be specific mechanisms too. A short formula works ('Industrialize + Integrate + Standardize'). A vague aspiration doesn't ('We make housing better').",
    tags: ["foundation", "thesis", "mandatory", "mechanism_test"],
    field: {
      key: "resolution",
      label: "Resolution",
      placeholder: "e.g., Industrialize + Integrate + Standardize",
      maxLength: 200,
      required: true,
    },
  },

  {
    id: "q1_6_stages",
    phase: 1,
    position: 7,
    type: "list_input",
    prompt:
      "Walk through your value chain — the stages of how you create and deliver value, from earliest input to final delivery.",
    why:
      "The value chain is the brand's structural advantage. It's also what makes the brand non-generic — competitors can copy positioning, but they can't easily copy a different value chain shape.",
    orientative:
      "Each stage should be something concrete that happens. Order matters — list them in sequence from earliest input to final delivery.",
    tags: ["foundation", "value_chain", "mandatory"],
    constraints: { min: 3, max: 8, itemMaxLength: 100, required: true },
    itemPlaceholder: "A stage in your value chain",
  },

  {
    id: "q1_6_effects",
    phase: 1,
    position: 8,
    type: "list_input",
    prompt:
      "Now: what's the cumulative effect of organizing those stages this particular way? List 2–5 effects.",
    why:
      "The effect of the value chain shape is what makes it structurally advantageous — and what competitors can't easily replicate.",
    orientative:
      "Each effect should be measurable or observable — not 'we deliver excellence' but 'margins are reduced because there are fewer intermediaries.'",
    tags: ["foundation", "value_chain", "mandatory"],
    constraints: { min: 2, max: 5, itemMaxLength: 100, required: true },
    itemPlaceholder: "An observable effect of your value chain",
  },

  {
    id: "q1_7",
    phase: 1,
    position: 9,
    type: "multi_field_group",
    extractable: true,
    extractionHint:
      "Extract the broad category the brand operates in (e.g., 'Residential Real Estate', 'Brand Strategy Consultancy', 'B2B SaaS'). Pull from how the brand describes itself in headlines or About copy, not from marketing taglines.",
    prompt:
      "What category does your brand operate in — the broad space, not the specific niche? And what dimensions matter in that category — what are people choosing between when they pick a brand here?",
    why:
      "Positioning is where the brand sits relative to competitors. The dimensions define the choice space.",
    orientative:
      "Category is the supermarket aisle. Axes are the variables on the back of the box. Avoid 'premium' or 'innovative' as axes — those describe how you market, not what you do.",
    tags: ["foundation", "positioning", "mandatory"],
    fields: [
      {
        key: "category",
        label: "Category",
        placeholder: "The broad category your brand operates in",
        maxLength: 100,
        required: true,
      },
    ],
  },

  {
    id: "q1_7_axes",
    phase: 1,
    position: 10,
    type: "list_input",
    prompt:
      "List 2–5 axes that matter in your category — the dimensions people weigh when picking a brand here.",
    why:
      "Axes define the decision space. They shape how proposals are evaluated and how your brand is positioned against alternatives.",
    orientative:
      "Concrete dimensions like 'price per unit', 'delivery time', 'customization range'. Not 'quality' or 'innovation'.",
    tags: ["foundation", "positioning", "mandatory"],
    constraints: { min: 2, max: 5, itemMaxLength: 80, required: true },
    itemPlaceholder: "An axis people weigh in this category",
  },

  {
    id: "q1_8",
    phase: 1,
    position: 11,
    type: "list_input",
    prompt:
      "List 3–5 specific things your brand does that competitors structurally cannot. Not 'we do it better' — what can you literally do that they can't, and why?",
    why:
      "Differentiation is the moat. Structural claims hold up; surface-level claims evaporate.",
    orientative:
      "If a competitor could write the same sentence about themselves, drop it. Differentiation only counts if it's structurally true for you and structurally not true for them.",
    tags: ["foundation", "differentiation", "mandatory", "competitor_test"],
    constraints: { min: 3, max: 5, itemMaxLength: 120, required: true },
    itemPlaceholder: "Something competitors structurally cannot do",
  },

  {
    id: "q1_9",
    phase: 1,
    position: 12,
    type: "list_input",
    prompt:
      "What is your brand NOT? Name 3–5 things you might be mistaken for, that you're explicitly not. This is often more powerful than what you are.",
    why:
      "Negative definition is what the brand refuses to be. Used as a hard boundary check on proposals and content.",
    orientative:
      "If you describe yourself as 'a housing platform', you might be mistaken for a traditional developer, an architecture firm, or a contractor. Naming these explicitly — 'not a traditional developer, not an architecture-only firm, not a contractor-only entity' — locks the boundaries.",
    tags: ["foundation", "negative_definition", "mandatory", "boundary_check"],
    constraints: {
      min: 3,
      max: 5,
      itemMaxLength: 80,
      required: true,
      itemFormatHint: "Format: 'not a/an X'",
    },
    itemPlaceholder: "not a/an …",
  },

  {
    id: "q1_10",
    phase: 1,
    position: 13,
    type: "list_input",
    extractable: true,
    extractionHint:
      "Extract 3-5 concrete, observable outcomes the brand claims to produce for customers. Look for results-language in About / value-prop / case-study pages. Favor structural outcomes ('faster delivery', 'lower per-unit cost') over experience-language ('great service'). If the materials only contain marketing fluff, leave empty rather than launder it.",
    prompt:
      "What 3–5 outcomes does your brand actually produce for customers? Not the experience — the outcomes.",
    why:
      "Outcomes are the brand's promise expressed as observable results.",
    orientative:
      "An outcome is something the customer ends up with that's measurably different. 'Faster delivery' (vs what they'd have otherwise) is an outcome. 'A great experience' is not.",
    tags: ["foundation", "outcomes", "mandatory", "mechanism_test"],
    constraints: { min: 3, max: 5, itemMaxLength: 60, required: true },
    itemPlaceholder: "An observable outcome you produce",
  },

  {
    id: "q1_11",
    phase: 1,
    position: 14,
    type: "per_locale_long_text",
    prompt:
      "Now distill all of the above into one paragraph: what is this brand and what does it do? Write this in your primary locale first. Then, if you have other supported locales, write it natively in each one — not translated.",
    why:
      "The most-quoted single piece of content in the entire system. Powers off-domain templates, \"what is this brand\" answers, elevator pitch. Must be natively written per locale — translation kills brand character.",
    orientative:
      "If you struggle to write this without using 'innovative', 'leading', 'comprehensive', or 'cutting-edge', go back to Q1.4–Q1.9 and pull from the mechanisms you named there. The good short definition reads like a structural fact, not a marketing line.",
    tags: [
      "foundation",
      "short_definition",
      "mandatory",
      "per_locale",
      "no_translation",
    ],
    fieldKey: "short_definition",
    minWords: 50,
    maxWords: 100,
    required: true,
  },

  {
    id: "q1_org",
    phase: 1,
    position: 15,
    type: "multi_field_group",
    extractable: true,
    extractionHint:
      "From the materials, extract structural facts about the COMPANY (not the brand voice): size band (solo / 2-10 / 11-50 / 51-200 / 200+), departments that exist, which teams produce brand-facing content most often, founded year, and HQ location(s). Use what's literally on the About page / careers page / footer. If a field isn't inferable, leave it empty: never invent. For 'departments', list specific teams the site mentions (Marketing, Sales, Engineering, etc.); don't guess based on company size. For 'brand_owners', leave empty unless the materials explicitly name who creates the company's content.",
    prompt:
      "A bit of organizational context. Roughly how large is the company, what teams exist, who produces the brand-facing content most often, when was it founded, and where is it based? Quick structural answers, not full bios.",
    why:
      "The shape of the organization sets the register for everything the LLM writes. A 5-person consultancy speaks differently from a 200-person platform. Knowing which teams own brand outputs lets the pack address its primary audience directly.",
    orientative:
      "For team size, a band is fine (solo, 2-10, 11-50, 51-200, 200+). For departments, list what actually exists: 'Founders, Marketing, Engineering' beats 'a small cross-functional team'. For brand-content owners, name the specific teams that write the public-facing content. Founded year as YYYY. Location as city + country, or 'remote-first' if that's the truth.",
    tags: ["foundation", "organization", "structural", "mandatory"],
    fields: [
      {
        key: "size_band",
        label: "Team size",
        placeholder: "solo / 2-10 / 11-50 / 51-200 / 200+",
        maxLength: 40,
        required: true,
      },
      {
        key: "departments",
        label: "Teams that exist",
        placeholder: "e.g., Founders, Marketing, Sales, Engineering, Design",
        maxLength: 240,
        required: true,
      },
      {
        key: "brand_owners",
        label: "Who produces brand-facing content most often",
        placeholder: "e.g., Marketing + Founders, or 'sole founder' for solo",
        maxLength: 200,
        required: false,
      },
      {
        key: "founded_year",
        label: "Founded",
        placeholder: "YYYY",
        maxLength: 12,
        required: false,
      },
      {
        key: "hq_location",
        label: "HQ / main locations",
        placeholder: "e.g., Lisbon, Portugal; or 'remote-first, team across EU'",
        maxLength: 200,
        required: false,
      },
    ],
  },
];

/** Locale option list — re-exported here for the locale-picker. */
export { SUPPORTED_LOCALES };
