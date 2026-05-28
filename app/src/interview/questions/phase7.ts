import type { Question } from "../types";

// Phase 7 — Examples library. Populates 31_EXAMPLES_LIBRARY_[LOCALE].
// The labor-intensive phase. Per the spec, target 30-45 examples per
// locale spanning primary channels. For v1, we capture this as a single
// structured_list — each row is a full example. The "guided builder
// with coverage tracker" UX from §7.1 is queued as Phase 4 polish work.
// All prompt / why / orientative strings verbatim from
// NINEYARDS_INTERVIEW_FULL.md.

export const PHASE_7_QUESTIONS: Question[] = [
  {
    id: "q7_1",
    phase: 7,
    position: 1,
    type: "select",
    prompt:
      "We recommend 30-45 examples per locale, spanning your primary channels. The system works without examples but produces more generic outputs. Investing 5-10 minutes per example pays off significantly. What's your commitment now?",
    why:
      "Examples are the highest-leverage piece of content. Each example is a piece of finished, on-brand output that the system uses as a shape anchor. More examples = more accurate brand matching. Fewer = more reliance on rules alone.",
    orientative:
      "Even 20 examples make a noticeable quality difference. If you can't commit to the full set now, you can add more after delivery — the file pack is editable.",
    tags: ["examples", "commitment"],
    fieldKey: "example_commitment",
    options: [
      { value: "full_45", label: "Full set (30–45 per locale)" },
      { value: "minimum_20", label: "Minimum (20 per locale)" },
      { value: "skip_for_now", label: "Skip examples for now" },
    ],
    required: true,
  },

  {
    id: "q7_2",
    phase: 7,
    position: 2,
    type: "structured_list",
    prompt:
      "Add examples one at a time. Each is a finished output for a specific channel / segment / register combination — the gold-standard shape your brand reasoning system should match.",
    why:
      "Each example anchors the system's content production for its channel + segment + register cell. The more cells you cover, the less the framework needs to generalize.",
    orientative:
      "Target distribution per locale: 5–8 INSTAGRAM, 5–8 LINKEDIN, 5–8 EMAIL, 3 INVESTOR_MEMO, 3 TECHNICAL_DOC, 3–5 WEB_HERO, 2–3 PRESS_RELEASE, 2–3 INTERNAL_MEMO, 5 SENSITIVE, 3–5 analytical open questions, 3–5 proposal evaluations.",
    tags: ["examples", "per_example"],
    optional: true,
    constraints: { min: 0, max: 60 },
    itemFields: [
      {
        key: "locale",
        label: "Locale (ISO code, e.g., en, pt)",
        type: "short_text",
        maxLength: 5,
        required: true,
      },
      {
        key: "channel",
        label: "Channel (INSTAGRAM, LINKEDIN, EMAIL, …)",
        type: "short_text",
        maxLength: 40,
        required: true,
      },
      {
        key: "segment",
        label: "Segment (ID from Q2.2)",
        type: "short_text",
        maxLength: 40,
        required: true,
      },
      {
        key: "register",
        label: "Register (precise / considered / conversational / accountable)",
        type: "short_text",
        maxLength: 30,
        required: true,
      },
      {
        key: "situation",
        label: "Situation (normal / sensitive)",
        type: "short_text",
        maxLength: 20,
        required: true,
      },
      {
        key: "mode",
        label:
          "Mode (content_generation / content_improvement / analytical_open / analytical_proposal)",
        type: "short_text",
        maxLength: 40,
        required: true,
      },
      {
        key: "prompt",
        label: "Trigger prompt — what a staff member would type",
        type: "long_text",
        maxLength: 300,
        required: true,
      },
      {
        key: "pillars_invoked",
        label: "Pillars invoked (comma-separated pillar IDs from Q3.1)",
        type: "short_text",
        maxLength: 100,
        required: true,
      },
      {
        key: "output",
        label: "Example output — the finished, on-brand piece",
        type: "long_text",
        maxLength: 2000,
        required: true,
      },
      {
        key: "why_it_works",
        label: "Why it works (comma-separated reasons)",
        type: "long_text",
        maxLength: 500,
        required: true,
      },
      {
        key: "common_traps_avoided",
        label: "Common traps avoided (optional)",
        type: "long_text",
        maxLength: 400,
      },
    ],
  },

  {
    id: "q7_final",
    phase: 7,
    position: 3,
    type: "long_text",
    optional: true,
    prompt:
      "Before we wrap, is there anything we didn't ask that you think we should know? Edge cases, history, founder context, audience nuances, things you'd want any AI to be careful about. Anything that makes your brand more accurately YOU.",
    why:
      "Frameworks have boundaries. A free-form closing field lets the user surface the one or two specific things that don't fit any structured question but matter for downstream output. Surfaced in BRAND CORE as 'Founder notes' so any LLM consuming the pack reads it as authoritative context.",
    orientative:
      "Optional. Skip if you've covered everything. If you do answer, be specific: 'we don't talk about competitor X by name in any output' or 'our founding story is in 2017, not 2015 (a common error in press)'. Avoid generic encouragement; concrete edge cases pay off most.",
    tags: ["final", "open", "context"],
    field: {
      key: "notes",
      label: "Founder notes",
      placeholder:
        "Anything we didn't ask that any AI consuming your brand pack should know",
      maxLength: 2000,
      required: false,
    },
  },
];
