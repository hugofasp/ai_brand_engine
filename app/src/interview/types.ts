/**
 * Interview question schema — source of truth for every question across
 * all 7 phases. Each Question is fully self-describing: type, prompt, why
 * it matters, orientative copy, tags, validation rules. The engine reads
 * this and renders the right input component.
 *
 * Verbatim copy is enforced at the data layer: when adding/editing a
 * question, the strings here MUST match NINEYARDS_INTERVIEW_FULL.md.
 */

export type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const PHASE_NAMES: Record<Phase, string> = {
  1: "Foundation",
  2: "Audience",
  3: "Pillars",
  4: "Voice",
  5: "Lexicon",
  6: "Channel specs",
  7: "Examples",
};

export type QuestionType =
  | "short_text"
  | "long_text"
  | "multi_field_group"
  | "list_input"
  | "structured_list"
  | "per_locale_text"
  | "per_locale_long_text"
  | "per_locale_list"
  | "multi_select_chips"
  | "slider_0_5"
  | "slider_pm2"
  | "select"
  | "channel_locale_defaults"
  | "segment_setup"
  | "segment_loop"
  | "pillar_setup"
  | "pillar_loop"
  | "per_locale_per_subkey"
  | "multi_field_select_group"
  | "per_locale_structured_list";

export type BaseQuestion = {
  id: string;            // "q1_1"
  phase: Phase;
  position: number;      // 1-N within phase
  prompt: string;        // The actual question text shown to the user
  why: string;           // "Why this matters" — italic sub-text
  orientative: string;   // Guidance callout pushing toward mechanism-first
  tags: string[];
  optional?: boolean;
  /**
   * Whether this question is shown given the current answers.
   * Used for skip behavior (e.g., Q1.2 only when locale_secondary non-empty).
   */
  showWhen?: (answers: Record<string, unknown>) => boolean;
  /**
   * DN-001: When true, the materials-extraction pipeline will attempt to
   * draft an answer from uploaded materials. The draft appears as a
   * suggestion below the input — the user still has to click "Use this"
   * to populate the field. Mechanism / reject_when / register / voice
   * sample questions are NOT extractable (they live in the founder's
   * head, not on the website).
   */
  extractable?: boolean;
  /**
   * Hint for the extraction prompt — what shape Claude should return for
   * this question's draft. Free-form natural language. Only consulted
   * when `extractable: true`.
   */
  extractionHint?: string;
};

export type ShortTextField = {
  key: string;             // JSONB sub-path inside this question's answer
  label: string;           // Field label (only shown when type is multi_field_group)
  placeholder?: string;
  maxLength?: number;
  /**
   * Target character count — the depth the answer should aim for, shown as
   * a countdown bar. Defaults to ~70% of maxLength when omitted. The user
   * isn't blocked from going below — it's signal, not enforcement.
   */
  targetChars?: number;
  required?: boolean;
  defaultFromQuestion?: string; // e.g., "q1_1.brand_name"
};

export type LongTextField = {
  key: string;
  label: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;     // soft warning at 75% of max
  minWords?: number;
  maxWords?: number;
  /** Target word count, similar idea to targetChars but for word-counted fields. */
  targetWords?: number;
  required?: boolean;
};

/** Compute a sensible target depth when one isn't explicitly set. */
export function inferTargetChars(maxLength?: number): number | undefined {
  if (!maxLength) return undefined;
  // ~70% of max, clamped to a reasonable floor.
  return Math.max(20, Math.floor(maxLength * 0.7));
}

export type ListConstraints = {
  min: number;
  max: number;
  itemMaxLength?: number;
  itemFormatHint?: string; // e.g., "format 'not a/an X'"
  required?: boolean;
};

export type StructuredListField = {
  key: string;
  label: string;
  type: "short_text" | "long_text";
  maxLength?: number;
  required?: boolean;
};

export type SelectOption = { value: string; label: string };

// --- Concrete question variants ---

export type ShortTextQuestion = BaseQuestion & {
  type: "short_text";
  field: ShortTextField;
};

export type LongTextQuestion = BaseQuestion & {
  type: "long_text";
  field: LongTextField;
};

export type MultiFieldGroupQuestion = BaseQuestion & {
  type: "multi_field_group";
  fields: ShortTextField[];
  rejectPhrases?: string[];  // shown as inline warning
  rejectMessage?: string;
};

export type ListInputQuestion = BaseQuestion & {
  type: "list_input";
  constraints: ListConstraints;
  itemPlaceholder?: string;
};

export type StructuredListQuestion = BaseQuestion & {
  type: "structured_list";
  itemFields: StructuredListField[];
  constraints: { min: number; max: number; required?: boolean };
};

export type PerLocaleTextQuestion = BaseQuestion & {
  type: "per_locale_text" | "per_locale_long_text";
  fieldKey: string;
  maxLength?: number;
  minWords?: number;
  maxWords?: number;
  required?: boolean;
};

export type PerLocaleListQuestion = BaseQuestion & {
  type: "per_locale_list";
  fieldKey: string;
  constraints: ListConstraints;
};

export type MultiSelectChipsQuestion = BaseQuestion & {
  type: "multi_select_chips";
  options: SelectOption[];
  allowCustom?: boolean;
};

export type SliderQuestion = BaseQuestion & {
  type: "slider_0_5" | "slider_pm2";
  /** Render N sliders, one per derived key (e.g., per context, per segment). */
  derivedFrom: "fixed" | "segments" | "contexts";
  fixedKeys?: string[]; // when derivedFrom = "fixed"
};

export type SelectQuestion = BaseQuestion & {
  type: "select";
  fieldKey: string;
  options: SelectOption[];
  required?: boolean;
};

export type ChannelLocaleDefaultsQuestion = BaseQuestion & {
  type: "channel_locale_defaults";
  channels: string[]; // INSTAGRAM, LINKEDIN, etc.
};

export type SegmentSetupQuestion = BaseQuestion & {
  type: "segment_setup";
  minCount: number;
  maxCount: number;
};

export type PillarSetupQuestion = BaseQuestion & {
  type: "pillar_setup";
  minCount: number;
  maxCount: number;
};

export type PillarLoopQuestion = BaseQuestion & {
  type: "pillar_loop";
  /** Which pillar_setup question to read the pillar list from. */
  sourceQuestionId: string;
  /** The sub-questions to ask, per pillar. Re-uses the segment loop sub-question shape. */
  subQuestions: SegmentLoopSubQuestion[];
};

export type SubKeySpec = {
  key: string;
  label: string;
  sublabel?: string;
  orientative?: string;
};

export type PerLocalePerSubKeyQuestion = BaseQuestion & {
  type: "per_locale_per_subkey";
  fieldKey: string;
  subKeys: SubKeySpec[];
  minWords?: number;
  maxWords?: number;
  maxLength?: number;
  validateContains?: string[];
  placeholder?: string;
};

/**
 * Multi-field group where each field is a select. Used for Q4.5 formatting
 * constraints (em dashes, exclamation marks, etc.).
 */
export type MultiFieldSelectGroupQuestion = BaseQuestion & {
  type: "multi_field_select_group";
  fields: Array<{
    key: string;
    label: string;
    options: SelectOption[];
    required?: boolean;
  }>;
};

/**
 * Per-locale wrapper for a list (Q5.1 signature phrases) or structured
 * list (Q5.2 substitutions, Q5.4 banned terms).
 */
export type PerLocaleStructuredListQuestion = BaseQuestion & {
  type: "per_locale_structured_list";
  fieldKey: string;
  variant: "list" | "structured_list";
  itemFields?: StructuredListField[];
  constraints: ListConstraints;
  itemPlaceholder?: string;
};

/**
 * Composite question that loops over each configured segment, rendering
 * a tabbed form with N sub-questions per segment. The renderer reads
 * the segment list from a referenced segment_setup question's answer.
 */
export type SegmentLoopQuestion = BaseQuestion & {
  type: "segment_loop";
  /** Which segment_setup question to read the segment list from. */
  sourceQuestionId: string;
  /** The sub-questions to ask, per segment. */
  subQuestions: SegmentLoopSubQuestion[];
};

export type SegmentLoopSubQuestion = {
  key: string;
  label: string;
  prompt: string;
  orientative?: string;
  type:
    | "short_text"
    | "long_text"
    | "list_input"
    | "per_locale_list"
    | "structured_list"
    | "slider_0_5"
    | "slider_pm2";
  /** For short/long text. */
  maxLength?: number;
  required?: boolean;
  /** For list_input + per_locale_list. */
  constraints?: ListConstraints;
  /** For structured_list. */
  itemFields?: StructuredListField[];
  itemPlaceholder?: string;
  /** For slider_0_5 — fixed list of keys (e.g., contexts). */
  fixedKeys?: Array<{ key: string; label: string; sublabel?: string }>;
  /** For slider_pm2 — derive keys at runtime from another question (e.g., segments). */
  derivedFromSource?: string;
};

export type PillarEntry = LoopEntry;
export type PillarSetupAnswer = {
  pillar_count: number;
  pillars: PillarEntry[];
};

export type LoopEntry = SegmentEntry;

export function readPillars(
  answers: Record<string, unknown>,
  sourceQuestionId: string,
): PillarEntry[] {
  for (let p = 1 as Phase; p <= 7; p = (p + 1) as Phase) {
    const ph = (answers[`phase_${p}` as `phase_${Phase}`] ??
      {}) as Record<string, unknown>;
    const q = ph[sourceQuestionId] as Partial<PillarSetupAnswer> | undefined;
    if (q?.pillars && Array.isArray(q.pillars)) return q.pillars;
    if (p === 7) break;
  }
  return [];
}

export function nextPillarId(existing: PillarEntry[]): string {
  const nums = existing
    .map((s) => Number((s.id.match(/(\d+)$/) ?? [])[1]))
    .filter((n) => Number.isFinite(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `PIL_${String(next).padStart(3, "0")}`;
}

export type Question =
  | ShortTextQuestion
  | LongTextQuestion
  | MultiFieldGroupQuestion
  | ListInputQuestion
  | StructuredListQuestion
  | PerLocaleTextQuestion
  | PerLocaleListQuestion
  | MultiSelectChipsQuestion
  | SliderQuestion
  | SelectQuestion
  | ChannelLocaleDefaultsQuestion
  | SegmentSetupQuestion
  | SegmentLoopQuestion
  | PillarSetupQuestion
  | PillarLoopQuestion
  | PerLocalePerSubKeyQuestion
  | MultiFieldSelectGroupQuestion
  | PerLocaleStructuredListQuestion;

// --- Segment data shape (output of Q2.2) ---

export type SegmentEntry = { id: string; name: string };

export type SegmentSetupAnswer = {
  segment_count: number;
  segments: SegmentEntry[];
  primary_segment_id: string;
};

export function readSegments(
  answers: Record<string, unknown>,
  sourceQuestionId: string,
): SegmentEntry[] {
  // segment_setup currently lives in phase 2; search across phases for
  // safety since the registry may relocate it later.
  for (let p = 1 as Phase; p <= 7; p = (p + 1) as Phase) {
    const ph = (answers[`phase_${p}` as `phase_${Phase}`] ??
      {}) as Record<string, unknown>;
    const q = ph[sourceQuestionId] as Partial<SegmentSetupAnswer> | undefined;
    if (q?.segments && Array.isArray(q.segments)) return q.segments;
    if (p === 7) break;
  }
  return [];
}

export function nextSegmentId(existing: SegmentEntry[]): string {
  const nums = existing
    .map((s) => Number((s.id.match(/(\d+)$/) ?? [])[1]))
    .filter((n) => Number.isFinite(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `SEG_${String(next).padStart(3, "0")}`;
}

// --- Locale codes (ISO 639-1 subset, common ones) ---

export const SUPPORTED_LOCALES: SelectOption[] = [
  { value: "en", label: "English" },
  { value: "pt", label: "Portuguese" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "it", label: "Italian" },
  { value: "de", label: "German" },
  { value: "nl", label: "Dutch" },
  { value: "pl", label: "Polish" },
  { value: "sv", label: "Swedish" },
  { value: "da", label: "Danish" },
  { value: "no", label: "Norwegian" },
  { value: "fi", label: "Finnish" },
];

// --- Channels (used in Q1.2 + Phase 6) ---

export const CHANNELS = [
  "INSTAGRAM",
  "LINKEDIN",
  "EMAIL",
  "INVESTOR_MEMO",
  "TECHNICAL_DOC",
  "WEB_HERO",
  "PRESS_RELEASE",
  "INTERNAL_MEMO",
] as const;
export type Channel = (typeof CHANNELS)[number];

// --- Universal blocklist (BUILD_SPEC §15 + STATIC_PAGES banned list) ---
// Expanded by NINEYARDS_PLATFORM_CONSTANTS.md (loaded at runtime).

export const UNIVERSAL_BLOCKLIST = [
  "innovative",
  "cutting-edge",
  "cutting edge",
  "transform",
  "unlock",
  "reimagine",
  "seamless",
  "journey",
  "leverage",
  "end-to-end",
  "end to end",
  "holistic",
  "synergy",
  "foster",
  "fuel",
  "ignite",
  "paradigm shift",
  "game-changer",
  "game changer",
  "leader in",
  "leading",
  "specializes in",
  "specialist in delivering",
  "best-in-class",
  "best in class",
  "comprehensive",
  "next-generation",
  "next generation",
  "world-class",
  "world class",
  "revolutionary",
  "groundbreaking",
  "disrupt",
  "disruptive",
];

/**
 * Scan a free-text string for universal AI-default cliches.
 * Case-insensitive, word-boundary-respecting.
 * Returns the matched terms (lower-cased), empty if clean.
 */
export function scanBlocklist(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const hits = new Set<string>();
  for (const term of UNIVERSAL_BLOCKLIST) {
    // word-boundary match
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "i");
    if (re.test(lower)) hits.add(term);
  }
  return Array.from(hits);
}

// --- Answer storage paths ---

export type AnswersJson = Partial<
  Record<`phase_${Phase}`, Record<string, unknown>>
>;

export function phaseKey(phase: Phase): `phase_${Phase}` {
  return `phase_${phase}` as `phase_${Phase}`;
}

/**
 * Derive the supported locales from the Q1.1 answer (or empty if not yet
 * answered). Used by per_locale_* renderers downstream.
 *
 * Tolerant of both shapes: locale_secondary may be a string[] (future)
 * or a comma-separated string (current multi_field_group encoding).
 */
export function getConfiguredLocales(
  answers: Record<string, unknown>,
): string[] {
  const phase1 = (answers[phaseKey(1)] ?? {}) as Record<string, unknown>;
  const q1_1 = (phase1.q1_1 ?? {}) as Record<string, unknown>;
  const primary = (q1_1.locale_primary as string | undefined)?.trim().toLowerCase();
  if (!primary) return [];
  const secondary = parseLocaleList(q1_1.locale_secondary);
  const seen = new Set<string>([primary]);
  const out = [primary];
  for (const loc of secondary) {
    if (!seen.has(loc)) {
      out.push(loc);
      seen.add(loc);
    }
  }
  return out;
}

function parseLocaleList(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[,\s]+/)
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}
