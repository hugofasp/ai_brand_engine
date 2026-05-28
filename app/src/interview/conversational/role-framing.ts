/**
 * Role-aware tone-modifier for Claude's conversational interview.
 *
 * Hugo's directive (point #4 of the conversational pivot):
 *  - role affects HOW Claude talks (translation effort, jargon tolerance,
 *    domain assumptions)
 *  - role does NOT affect what gets stored in the framework files (same
 *    extraction shape regardless of who answered)
 *
 * Pulled from contact_role on the requests table — captured at /start.
 */

import type { ContactRole } from "@/lib/supabase/types";

export type RoleFraming = {
  /** One paragraph slotted into the system prompt: "you're talking with…" */
  speakerContext: string;
  /** Translation discipline: how much Claude rewrites framework terms. */
  jargonTolerance: "fluent" | "translate-lightly" | "translate-heavily";
  /** Sample-driven choices vs abstract questions — how often Claude shows
   * concrete A/B/C options instead of asking open questions. */
  preferConcreteChoices: boolean;
};

const FRAMINGS: Record<NonNullable<ContactRole> | "default", RoleFraming> = {
  Founder: {
    speakerContext:
      "You're talking with the founder. They know strategy and direction. They're less native in marketing-specific framing — translate brand-strategy terms when you use them, but you can lean on metaphors and big-picture framing. Founders speak in outcomes and stakes; you should too. Use their time efficiently — they'll cut you off if you're explaining the obvious.",
    jargonTolerance: "translate-lightly",
    preferConcreteChoices: true,
  },
  Marketing: {
    speakerContext:
      "You're talking with someone on the marketing team. They speak voice / audience / channel natively. You can use terms like 'positioning', 'differentiation', 'tone' without translation. They'll resent over-explanation. You can move faster on voice and audience questions and slower on structural / strategic ones (where they may know less about company-internal mechanisms).",
    jargonTolerance: "fluent",
    preferConcreteChoices: false,
  },
  Brand: {
    speakerContext:
      "You're talking with a brand specialist. They're the most fluent in the framework's language and will appreciate directness. You can use 'pillar', 'register', 'mechanism', 'reject-when' with light gloss. Don't over-translate or simplify — it reads as condescension to a brand person. You can move faster on every topic.",
    jargonTolerance: "fluent",
    preferConcreteChoices: false,
  },
  Operations: {
    speakerContext:
      "You're talking with an operations leader. They know the company's mechanics — process, structure, capacity — but may be less native in brand and voice work. Lean on concrete examples over abstractions. When asking about voice, show samples and let them pick rather than asking 'what's your voice identity'. They'll be precise on structural facts and may underweight voice/audience questions — gently probe those.",
    jargonTolerance: "translate-heavily",
    preferConcreteChoices: true,
  },
  Other: {
    speakerContext:
      "You're talking with someone whose role isn't framework-coded. Assume they have full context on the business but limited fluency in brand strategy jargon. Translate every framework term you use ('brand pillars' → 'the few core things you do that nobody else does'). Show samples whenever voice or audience comes up — let them pick rather than asking abstract questions.",
    jargonTolerance: "translate-heavily",
    preferConcreteChoices: true,
  },
  default: {
    speakerContext:
      "You're talking with the brand owner or their representative. You don't know their formal role. Assume they have full context on the business but may not be native in brand-strategy jargon. Translate framework terms and show samples for voice / audience choices.",
    jargonTolerance: "translate-heavily",
    preferConcreteChoices: true,
  },
};

export function getRoleFraming(role: ContactRole | null | undefined): RoleFraming {
  if (!role) return FRAMINGS.default;
  return FRAMINGS[role] ?? FRAMINGS.default;
}
