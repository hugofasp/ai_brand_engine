import type { Question } from "../types";

// Phase 3 — Pillars. Populates 12_PILLARS.
// All prompt / why / orientative strings verbatim from
// NINEYARDS_INTERVIEW_FULL.md.

const CONTEXT_KEYS = [
  { key: "SALES", label: "Sales" },
  { key: "INVESTOR", label: "Investor" },
  { key: "TECHNICAL", label: "Technical" },
  { key: "COMMUNITY", label: "Community" },
  { key: "INTERNAL", label: "Internal" },
];

export const PHASE_3_QUESTIONS: Question[] = [
  {
    id: "q3_1",
    phase: 3,
    position: 1,
    type: "pillar_setup",
    prompt:
      "How many distinct pillars does your brand have? Each pillar should be a separate mechanism by which your brand creates value. Typical range: 4-7 pillars.",
    why:
      "Pillars are the building blocks of every analytical response and many content selections. Each pillar's mechanism + decision rules become the substrate the system reasons over.",
    orientative:
      "Fewer than 4 pillars usually means the brand is under-articulated. More than 7 usually means duplication. Aim for distinct mechanisms — each pillar should be doing something different from the others.",
    tags: ["pillars", "count", "mandatory"],
    minCount: 3,
    maxCount: 8,
  },

  {
    id: "q3_2",
    phase: 3,
    position: 2,
    type: "pillar_loop",
    prompt:
      "Now describe each pillar in detail. Use the tabs above to switch between pillars — fill out all sections for each one.",
    why:
      "Each pillar's mechanism and decision rules drive proposal evaluation and content selection at runtime. The reject_when conditions are the most consequential — they're how the system identifies when a proposal contradicts a pillar.",
    orientative:
      "Work through one pillar at a time. The 'reject_when' rules are the most important field — they tell the system when this pillar would do harm or fail. Be specific. 'When user needs exceed typology limits' is a real reject_when. 'When we don't feel like it' is not.",
    tags: ["pillars", "per_pillar"],
    sourceQuestionId: "q3_1",
    subQuestions: [
      {
        key: "problem",
        label: "Q3.2.1 · Pillar problem",
        prompt:
          "What problem does this pillar specifically address — what's the inefficiency or friction it resolves?",
        orientative:
          "Each pillar should resolve a different inefficiency. If two pillars address the same problem, consolidate them.",
        type: "long_text",
        maxLength: 250,
        required: true,
      },
      {
        key: "mechanism",
        label: "Q3.2.2 · Mechanism",
        prompt:
          "What's the mechanism — the specific thing your brand does that resolves that problem? Not a value, not a benefit. The literal mechanism.",
        orientative:
          "If the problem is 'manual construction increases variability', the mechanism might be 'LSF, modular, precast, 3D printing'. Specific. Operational.",
        type: "long_text",
        maxLength: 250,
        required: true,
      },
      {
        key: "accept_when",
        label: "Q3.2.3 · Accept when (2–4 conditions)",
        prompt:
          "When does this pillar's mechanism apply? Name 2-4 conditions under which using this mechanism is the right call.",
        orientative:
          "Accept_when conditions are positive triggers — when these conditions hold, this pillar is in play.",
        type: "list_input",
        constraints: { min: 2, max: 4, itemMaxLength: 100, required: true },
        itemPlaceholder: "A condition under which this pillar applies",
      },
      {
        key: "reject_when",
        label: "Q3.2.4 · Reject when (2–4 conditions) — critical",
        prompt:
          "When does this pillar's mechanism NOT apply, even if it's available? Name 2-4 conditions under which you shouldn't use this mechanism.",
        orientative:
          "This is the most important field for evaluating proposals. Reject_when conditions are when the mechanism would do harm or fail. 'When user needs exceed typology limits' is a real reject_when. 'When we don't feel like it' is not.",
        type: "list_input",
        constraints: { min: 2, max: 4, itemMaxLength: 100, required: true },
        itemPlaceholder: "A condition under which this pillar should be rejected",
      },
      {
        key: "effect",
        label: "Q3.2.5 · Effect",
        prompt:
          "What's the effect when this pillar's mechanism is applied? What measurably changes?",
        orientative:
          "Use arrows to show direction: 'Time ↓, cost ↓, predictability ↑'. Or describe the observable change.",
        type: "short_text",
        maxLength: 200,
        required: true,
      },
      {
        key: "context_weights",
        label: "Q3.2.6 · Context weights (0–5)",
        prompt:
          "For each context, how heavily does this pillar weigh in shaping content or analysis? 0 = irrelevant, 5 = THE pillar for this context.",
        orientative:
          "Most pillars are 2–4 in their primary contexts and 1–2 elsewhere. Don't be afraid of 0s — pillars should be specialized, not universal.",
        type: "slider_0_5",
        fixedKeys: CONTEXT_KEYS,
      },
      {
        key: "segment_modifiers",
        label: "Q3.2.7 · Segment modifiers (-2 to +2)",
        prompt:
          "Does this pillar matter more or less for specific segments? Adjust by -2 to +2 per segment.",
        orientative:
          "If a pillar is universally relevant, leave all modifiers at 0. Use +1 or +2 only when this pillar is specifically more important for that segment than the base weight suggests. Use -1 or -2 when it's specifically less.",
        type: "slider_pm2",
        derivedFromSource: "q2_2",
      },
    ],
  },

  {
    id: "q3_3",
    phase: 3,
    position: 3,
    type: "structured_list",
    prompt:
      "What tensions exist between your pillars? Name 2-4 pairs that genuinely pull in opposite directions, and how you resolve each tension.",
    why:
      "Documented contradictions become explicit trade-off framings in analytical-mode evaluation. They acknowledge that no system is tension-free, and they tell the framework how to handle the tension when it arises.",
    orientative:
      "If your pillars never tension with each other, they're probably not specific enough. Real systems have trade-offs. Naming them is honest and useful.",
    tags: ["pillars", "contradictions", "trade_off_framing"],
    constraints: { min: 1, max: 5, required: true },
    itemFields: [
      {
        key: "tension",
        label: "Tension",
        type: "short_text",
        maxLength: 100,
        required: true,
      },
      {
        key: "interpretation",
        label: "Interpretation",
        type: "long_text",
        maxLength: 250,
        required: true,
      },
      {
        key: "resolution_rule",
        label: "Resolution rule",
        type: "long_text",
        maxLength: 250,
        required: true,
      },
    ],
  },

  {
    id: "q3_4",
    phase: 3,
    position: 4,
    type: "long_text",
    prompt:
      "In one sentence: what's the single rule that resolves any pillar tension when no specific resolution applies?",
    why:
      "Meta-rule. When the contradictions in Q3.3 don't cover a specific situation, the system principle is the tiebreaker.",
    orientative:
      "This is the meta-rule. 'When in doubt, prioritize cost reduction.' 'When in doubt, prioritize customer trust.' 'When in doubt, prioritize the operational system over a one-off optimization.' One sentence.",
    tags: ["pillars", "system_principle", "meta_rule", "mandatory"],
    field: {
      key: "system_principle",
      label: "System principle",
      placeholder: "When in doubt, …",
      maxLength: 200,
      required: true,
    },
  },
];
