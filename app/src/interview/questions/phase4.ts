import type { Question, SubKeySpec } from "../types";

/**
 * Sub-keys for the per-locale-per-register / per-locale-per-situation
 * answer shapes. Originally lived alongside the legacy form-UI
 * component; pulled inline here after that UI was deleted. Still
 * used by materials extraction and the brand-pack generator.
 */
const REGISTER_SUBKEYS: SubKeySpec[] = [
  { key: "precise", label: "Precise" },
  { key: "considered", label: "Considered" },
  { key: "conversational", label: "Conversational" },
  { key: "accountable", label: "Accountable" },
];
const SITUATION_SUBKEYS: SubKeySpec[] = [
  { key: "delays", label: "Delays" },
  { key: "complaints", label: "Complaints" },
  { key: "price_changes", label: "Price changes" },
  { key: "closures", label: "Closures" },
  { key: "refunds", label: "Refunds" },
];

// Phase 4 — Voice. Populates 20_VOICE_CORE + 21_VOICE_FLEX_[LOCALE].
// All prompt / why / orientative strings verbatim from
// NINEYARDS_INTERVIEW_FULL.md.

export const PHASE_4_QUESTIONS: Question[] = [
  {
    id: "q4_1",
    phase: 4,
    position: 1,
    type: "list_input",
    prompt:
      "How does your brand actually sound? Give us 3-5 descriptors that capture its identity. Not adjectives like 'professional' or 'friendly' — descriptors with character.",
    why:
      "Identity descriptors anchor every register. They're the highest-order signal the system uses when deciding how to phrase anything.",
    orientative:
      "'Engineering-first', 'system-driven', 'operator mindset' — these have edge. 'Professional', 'approachable', 'modern' — these don't. If your descriptors could apply to any brand, push for sharper ones.",
    tags: ["voice", "identity", "mandatory", "competitor_test"],
    constraints: { min: 3, max: 5, itemMaxLength: 50, required: true },
    itemPlaceholder: "A voice descriptor with edge",
  },

  {
    id: "q4_2",
    phase: 4,
    position: 2,
    type: "list_input",
    prompt:
      "What 4-6 adjectives describe the texture of your voice? These are more granular than identity — the qualities of how sentences feel.",
    why:
      "Texture traits inform sentence-level decisions: rhythm, length, density. They translate identity into actual prose.",
    orientative:
      "Texture traits: 'precise', 'controlled', 'rational', 'declarative'. Some brands lean 'rhythmic', 'lyrical', 'spacious'. Pick the 4–6 that describe how your sentences should feel to read.",
    tags: ["voice", "traits", "mandatory"],
    constraints: { min: 4, max: 6, itemMaxLength: 40, required: true },
    itemPlaceholder: "A texture trait",
  },

  {
    id: "q4_3",
    phase: 4,
    position: 3,
    type: "long_text",
    prompt:
      "What's the single irreducible voice principle? If your team had to remember only one rule about how the brand talks, what would it be?",
    why:
      "The meta-rule that resolves voice disagreements when nothing more specific applies. One sentence the team can recite.",
    orientative:
      "'Explain systems, not emotions.' 'Lead with mechanism, never with promise.' 'Numbers before adjectives.' One sentence. This rule should resolve most voice disagreements.",
    tags: ["voice", "core_rule", "mandatory", "meta_rule"],
    field: {
      key: "core_rule",
      label: "Core rule",
      placeholder: "Your single irreducible voice principle",
      maxLength: 200,
      required: true,
    },
  },

  {
    id: "q4_4",
    phase: 4,
    position: 4,
    type: "list_input",
    prompt:
      "Beyond the universal AI-default blocklist we include automatically (words like 'innovative', 'cutting-edge', 'reimagine'), are there specific phrases your brand never uses?",
    why:
      "Brand-specific forbidden phrases catch what universal blocklists miss — like a brand that's banned 'solution' in favor of 'system'.",
    orientative:
      "These are brand-specific. Maybe you've banned 'solution' (you use 'system' instead) or 'partner' (you use 'client' or 'customer'). List anything specific to your brand.",
    tags: ["voice", "forbidden_phrases", "brand_specific"],
    optional: true,
    constraints: { min: 0, max: 15, itemMaxLength: 60 },
    itemPlaceholder: "A brand-specific forbidden phrase",
  },

  {
    id: "q4_5",
    phase: 4,
    position: 5,
    type: "multi_field_select_group",
    prompt:
      "Are there formatting choices your brand has decided on? Em dashes vs commas, exclamation marks allowed or banned, all-caps for emphasis or never, etc.",
    why:
      "Setting explicit rules removes the LLM's default variability on small formatting choices that, in aggregate, shape brand consistency.",
    orientative:
      "Pick what you've actually decided. Most brands haven't — and the LLM will use whatever feels right by default. Setting explicit rules removes that variability.",
    tags: ["voice", "formatting"],
    fields: [
      {
        key: "em_dashes",
        label: "Em dashes",
        options: [
          { value: "allow", label: "Allow" },
          { value: "forbid", label: "Forbid" },
          { value: "undecided", label: "Undecided" },
        ],
      },
      {
        key: "exclamation_marks",
        label: "Exclamation marks",
        options: [
          { value: "allow", label: "Allow" },
          { value: "forbid", label: "Forbid" },
          { value: "undecided", label: "Undecided" },
        ],
      },
      {
        key: "all_caps_emphasis",
        label: "ALL CAPS for emphasis",
        options: [
          { value: "allow", label: "Allow" },
          { value: "forbid", label: "Forbid" },
          { value: "undecided", label: "Undecided" },
        ],
      },
      {
        key: "oxford_comma",
        label: "Oxford comma",
        options: [
          { value: "use", label: "Use" },
          { value: "omit", label: "Omit" },
          { value: "undecided", label: "Undecided" },
        ],
      },
      {
        key: "heading_case",
        label: "Heading case",
        options: [
          { value: "sentence", label: "Sentence case" },
          { value: "title", label: "Title Case" },
          { value: "lowercase", label: "lowercase" },
          { value: "undecided", label: "Undecided" },
        ],
      },
      {
        key: "emoji_policy",
        label: "Emoji policy (overall)",
        options: [
          { value: "allow", label: "Allow" },
          { value: "forbid", label: "Forbid" },
          { value: "specific_channels_only", label: "Specific channels only" },
          { value: "undecided", label: "Undecided" },
        ],
      },
    ],
  },

  {
    id: "q4_6",
    phase: 4,
    position: 6,
    type: "per_locale_per_subkey",
    prompt:
      "Show us what your brand sounds like in each register, in each locale. Write a 60-120 word sample piece that demonstrates the register. The topic can be anything within your brand's domain.",
    why:
      "Register samples are the most influential anchors the system uses for voice. The 4 registers cover the full range from precise technical writing to accountable sensitive responses.",
    orientative:
      "Native per locale — not translated. Each register has its own character: read the orientative box for the active register before writing.",
    tags: [
      "voice",
      "register_samples",
      "per_locale",
      "per_register",
      "no_translation",
    ],
    fieldKey: "register_samples",
    subKeys: REGISTER_SUBKEYS,
    minWords: 60,
    maxWords: 200,
  },

  {
    id: "q4_7",
    phase: 4,
    position: 7,
    type: "per_locale_per_subkey",
    prompt:
      "When something goes wrong — delays, complaints, price changes, closures, refunds — how does your brand handle each? Write a one-paragraph playbook per sensitive situation type, per locale.",
    why:
      "Sensitive playbooks become the brand's accountable structure under pressure. The framework applies them when it detects a sensitive context.",
    orientative:
      "Be specific about what your brand always includes (e.g., 'always state the cause', 'always commit to a new date'). 50–200 words per situation.",
    tags: ["voice", "sensitive_playbook", "per_locale"],
    fieldKey: "sensitive_playbook",
    subKeys: SITUATION_SUBKEYS,
    minWords: 50,
    maxWords: 200,
  },

  {
    id: "q4_8",
    phase: 4,
    position: 8,
    type: "per_locale_per_subkey",
    prompt:
      "When someone asks your brand reasoning system about something outside your domain, how should it respond? Write a refusal template per register, per locale.",
    why:
      "Off-domain templates fire when the topic is outside the brand's scope. Each register has its own version. Use the [BRAND_NAME] and [TOPIC] placeholders.",
    orientative:
      "The off-domain template fires when the topic is outside your brand's scope. Each register has its own version — a precise refusal sounds different from a conversational one. Use the placeholders [BRAND_NAME], [SHORT_DEFINITION], and [TOPIC] where the system should substitute values.",
    tags: ["voice", "off_domain", "per_locale", "per_register"],
    fieldKey: "off_domain_templates",
    subKeys: REGISTER_SUBKEYS,
    validateContains: ["[BRAND_NAME]", "[TOPIC]"],
    minWords: 10,
    maxWords: 80,
    placeholder:
      "1-3 sentences. Must contain [BRAND_NAME] and [TOPIC] placeholders.",
  },
];
