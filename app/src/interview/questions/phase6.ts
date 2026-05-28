import type { Question } from "../types";

// Phase 6 — Channel specs. Populates 30_CHANNEL_SPECS_[LOCALE].
// Mostly platform defaults; questions only for brand-specific deviations.
// All prompt / why / orientative strings verbatim from
// NINEYARDS_INTERVIEW_FULL.md.

export const PHASE_6_QUESTIONS: Question[] = [
  {
    id: "q6_2",
    phase: 6,
    position: 1,
    type: "per_locale_structured_list",
    prompt:
      "Are there specific opening phrases your brand never uses?",
    why:
      "Forbidden openers catch generic email/post starts that the LLM will reach for by default. Defining these locks the brand voice from sentence one.",
    orientative:
      "Common ones to ban: 'Hi there!', 'Hope you're well', 'Just checking in', 'I hope this finds you well'. Add any specific to your brand.",
    tags: ["channels", "forbidden_openers", "per_locale"],
    fieldKey: "forbidden_openers",
    variant: "list",
    optional: true,
    constraints: { min: 0, max: 15, itemMaxLength: 80 },
    itemPlaceholder: "A forbidden opener",
  },

  {
    id: "q6_3",
    phase: 6,
    position: 2,
    type: "multi_field_select_group",
    prompt: "What's your hashtag policy for social channels?",
    why:
      "Hashtag use is one of the highest-variance choices LLMs make. An explicit policy removes the guessing.",
    orientative:
      "If you don't use hashtags at all on a channel, set 'never'. If they're optional, 'on_request'. If always, 'always'.",
    tags: ["channels", "hashtags"],
    fields: [
      {
        key: "instagram_enabled",
        label: "Instagram",
        options: [
          { value: "always", label: "Always" },
          { value: "never", label: "Never" },
          { value: "on_request", label: "On request" },
        ],
      },
      {
        key: "linkedin_enabled",
        label: "LinkedIn",
        options: [
          { value: "always", label: "Always" },
          { value: "never", label: "Never" },
          { value: "on_request", label: "On request" },
        ],
      },
    ],
  },

  {
    id: "q6_4",
    phase: 6,
    position: 3,
    type: "multi_field_select_group",
    prompt: "What's your emoji policy?",
    why:
      "Emoji norms vary wildly by brand. Setting per-channel rules removes the LLM's default behavior.",
    orientative:
      "If your brand doesn't use emoji at all, set 'forbid' everywhere. If you allow them as conversation hooks but not in body copy, use 'allow_one_hook'.",
    tags: ["channels", "emoji"],
    fields: [
      {
        key: "instagram",
        label: "Instagram",
        options: [
          { value: "forbid", label: "Forbid" },
          { value: "allow_one_hook", label: "Allow one hook" },
          { value: "allow_freely", label: "Allow freely" },
        ],
      },
      {
        key: "linkedin",
        label: "LinkedIn",
        options: [
          { value: "forbid", label: "Forbid" },
          { value: "allow_one_hook", label: "Allow one hook" },
          { value: "allow_freely", label: "Allow freely" },
        ],
      },
      {
        key: "email",
        label: "Email",
        options: [
          { value: "forbid", label: "Forbid" },
          { value: "allow_subject_only", label: "Allow subject only" },
          { value: "allow_freely", label: "Allow freely" },
        ],
      },
      {
        key: "internal",
        label: "Internal memos",
        options: [
          { value: "forbid", label: "Forbid" },
          { value: "allow_freely", label: "Allow freely" },
        ],
      },
    ],
  },

  {
    id: "q6_6",
    phase: 6,
    position: 4,
    type: "list_input",
    prompt:
      "Any rules that apply across all your channels that we should make explicit?",
    why:
      "Cross-channel rules are the universals — things true everywhere your brand publishes. The framework applies them in every channel-aware draft.",
    orientative:
      "Examples: 'Never use rhetorical questions as openers.' 'Numbers always specific, never rounded unless explicitly an estimate.' 'No \"we\" statements without a mechanism attached.'",
    tags: ["channels", "cross_channel_rules"],
    optional: true,
    constraints: { min: 0, max: 10, itemMaxLength: 150 },
    itemPlaceholder: "A cross-channel rule",
  },
];
