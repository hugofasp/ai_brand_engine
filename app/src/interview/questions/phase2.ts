import type { Question } from "../types";

// Phase 2 — Audience. Populates 11_AUDIENCE.
// All prompt / why / orientative strings verbatim from
// NINEYARDS_INTERVIEW_FULL.md.

export const PHASE_2_QUESTIONS: Question[] = [
  {
    id: "q2_1",
    phase: 2,
    position: 1,
    type: "multi_field_group",
    prompt:
      "What's the structural condition that defines your audience? We're not asking demographics — we're asking what shared position puts someone in your audience. For example: 'exposure to inefficient housing production and fragmented financing' is a structural condition. 'Millennials' is not.",
    why:
      "Meta-definition that segments inherit from. Anchors every segment to a shared structural truth.",
    orientative:
      "Demographics don't survive analysis — people in the same demographic make different choices for different reasons. Structural conditions do survive — they predict behavior. Aim for what's structurally true about your audience.",
    tags: ["audience", "framing", "mandatory", "mechanism_test"],
    fields: [
      {
        key: "primary_insight",
        label: "Primary insight (one sentence)",
        placeholder: "The structural condition that defines who's in your audience",
        maxLength: 200,
        required: true,
      },
      {
        key: "consequence",
        label: "Consequence (one sentence)",
        placeholder: "What that condition leads to — the behavior or need it produces",
        maxLength: 200,
        required: true,
      },
    ],
  },

  {
    id: "q2_2",
    phase: 2,
    position: 2,
    type: "segment_setup",
    prompt:
      "How many distinct audience segments do you serve? Then, which one is the most central — the one that defines the rest? That becomes your primary segment (the default when a prompt doesn't specify).",
    why:
      "Number of segments shapes the rest of Phase 2. Primary segment is the fallback for everything.",
    orientative:
      "Typical range: 2–4 segments. Fewer than 2 = probably under-segmented. More than 4 = probably over-segmented. If you're not sure, start with 2–3.",
    tags: ["audience", "segments", "mandatory"],
    minCount: 1,
    maxCount: 6,
  },

  {
    id: "q2_3",
    phase: 2,
    position: 3,
    type: "segment_loop",
    prompt:
      "Now describe each segment in detail. Use the tabs above to switch between segments — fill out all sections for each one.",
    why:
      "Per-segment depth is what makes the audience model usable. Each segment becomes its own selector in the file pack — when a prompt mentions a trigger phrase, the system knows which segment's drivers to weight.",
    orientative:
      "Work through one segment at a time. Triggers should be natural ways someone would phrase a prompt about that segment. Drivers and non-drivers are equally important — knowing what your audience does NOT optimize for prevents your team's content from missing the mark.",
    tags: ["audience", "segment", "per_segment"],
    sourceQuestionId: "q2_2",
    subQuestions: [
      {
        key: "name_and_triggers",
        label: "Q2.3.1 · Name & triggers",
        prompt:
          "Per locale, 5-8 trigger phrases — words or short phrases that, if a staff member used them in a prompt, would clearly signal they're talking about this segment.",
        orientative:
          "Triggers should be natural ways someone would actually phrase a prompt. 'first-time buyer', 'first home', 'starter unit', 'young couple looking to buy' — all good. 'demographic A' — not useful.",
        type: "per_locale_list",
        constraints: { min: 5, max: 8, itemMaxLength: 60, required: true },
        itemPlaceholder: "A natural trigger phrase",
      },
      {
        key: "structural_conditions",
        label: "Q2.3.2 · Structural conditions",
        prompt:
          "What 2-5 structural conditions place someone in this segment?",
        orientative:
          "Specific. Mechanistic. Not 'they want X' — what structural reality puts them in your audience?",
        type: "list_input",
        constraints: { min: 2, max: 5, itemMaxLength: 150, required: true },
        itemPlaceholder: "A structural condition",
      },
      {
        key: "financial_position",
        label: "Q2.3.2 · Financial position",
        prompt: "Describe this segment's financial position.",
        type: "long_text",
        maxLength: 200,
        required: true,
      },
      {
        key: "stage_of_life",
        label: "Q2.3.2 · Stage of life",
        prompt: "Describe this segment's stage of life.",
        type: "long_text",
        maxLength: 200,
        required: true,
      },
      {
        key: "primary_condition",
        label: "Q2.3.3 · Primary condition",
        prompt:
          "In one sentence: the single most important condition that defines this segment.",
        orientative:
          "If you can name one structural truth that makes someone a member of this segment, that's the primary condition. Concrete.",
        type: "long_text",
        maxLength: 250,
        required: true,
      },
      {
        key: "core_problem",
        label: "Q2.3.4 · Core problem",
        prompt:
          "What's this segment's core problem — the structural friction they're facing?",
        orientative:
          "Must be structural friction, not an outcome they desire. 'They face a down payment barrier on traditional purchases' is structural. 'They want their dream home' is not.",
        type: "long_text",
        maxLength: 250,
        required: true,
      },
      {
        key: "drivers",
        label: "Q2.3.5 · Drivers (3–5)",
        prompt: "What 3–5 things drive their decisions?",
        orientative:
          "Drivers are the things they actually weigh when deciding. If you've named the wrong drivers, your content will speak past them.",
        type: "list_input",
        constraints: { min: 3, max: 5, itemMaxLength: 80, required: true },
        itemPlaceholder: "A driver of their decisions",
      },
      {
        key: "non_drivers",
        label: "Q2.3.6 · Non-drivers (3–5)",
        prompt:
          "What 3–5 things do NOT drive their decisions, that competitors might wrongly assume drive them?",
        orientative:
          "Non-drivers are equally important. If competitors are aiming at the wrong things, knowing what to NOT emphasize is a competitive advantage.",
        type: "list_input",
        constraints: { min: 3, max: 5, itemMaxLength: 80, required: true },
        itemPlaceholder: "Something that doesn't drive them",
      },
      {
        key: "system_fit",
        label: "Q2.3.7 · Why your brand fits this segment",
        prompt:
          "What about your brand structure serves this segment specifically?",
        type: "long_text",
        maxLength: 300,
        required: true,
      },
      {
        key: "why_segment_matters",
        label: "Q2.3.7 · Why this segment matters",
        prompt:
          "Why is this segment important to your business model — what do they unlock for you?",
        type: "long_text",
        maxLength: 300,
        required: true,
      },
    ],
  },

  {
    id: "q2_4",
    phase: 2,
    position: 4,
    type: "list_input",
    prompt:
      "What conditions are true across all your segments? What do they all share, that distinguishes your overall audience from people who aren't your audience at all?",
    why:
      "Defines the outer edge of your audience — the conditions a person must meet just to be in the audience at all, before segment-specific criteria narrow further.",
    orientative:
      "These are the conditions that everyone in your audience meets, regardless of which specific segment they're in.",
    tags: ["audience", "common", "boundary_check"],
    constraints: { min: 1, max: 5, itemMaxLength: 120, required: true },
    itemPlaceholder: "A condition shared across all segments",
  },

  {
    id: "q2_5",
    phase: 2,
    position: 5,
    type: "structured_list",
    prompt:
      "Who is explicitly NOT your audience, even though they might superficially seem like a fit? Name 3-5 non-target profiles and why each is excluded.",
    why:
      "Named non-targets prevent the brand reasoning system from misclassifying lookalikes. Used as a boundary check at runtime.",
    orientative:
      "These are people who look like they should be in your audience but aren't. Naming them explicitly prevents your brand reasoning system from misclassifying them.",
    tags: ["audience", "non_targets", "boundary_check"],
    itemFields: [
      {
        key: "description",
        label: "Description",
        type: "short_text",
        maxLength: 150,
        required: true,
      },
      {
        key: "reason_for_exclusion",
        label: "Reason for exclusion",
        type: "long_text",
        maxLength: 200,
        required: true,
      },
    ],
    constraints: { min: 3, max: 5, required: true },
  },

  {
    id: "q2_6",
    phase: 2,
    position: 6,
    type: "multi_field_group",
    prompt:
      "What three conditions, when all met, lead your audience to actually commit (buy, sign, decide)?",
    why:
      "Used in proposal evaluation as criteria for whether a proposed change improves or impedes conversion.",
    orientative:
      "Three thresholds: access (can they?), structure (does the offer's structure work for them?), confidence (do they trust it'll happen?). For any of your segments, what specifically constitutes each?",
    tags: ["audience", "decision_thresholds", "mandatory"],
    fields: [
      {
        key: "access_condition",
        label: "Access condition",
        placeholder: "Can they reach the offering?",
        maxLength: 200,
        required: true,
      },
      {
        key: "structure_condition",
        label: "Structure condition",
        placeholder: "Does the offer's structure work for them?",
        maxLength: 200,
        required: true,
      },
      {
        key: "confidence_condition",
        label: "Confidence condition",
        placeholder: "Do they trust it'll happen?",
        maxLength: 200,
        required: true,
      },
    ],
  },
];
