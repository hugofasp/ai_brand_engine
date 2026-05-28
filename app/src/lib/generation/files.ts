import "server-only";
import type { BrandPackFile, RenderContext } from "./types";
import {
  ph,
  q,
  s,
  l,
  bullets,
  numbered,
  defList,
  section,
  fileHeader,
  perLocale,
} from "./render-helpers";

/* ------------------------------------------------------------------ *
 * File registry — every file the brand pack ships with.              *
 *                                                                    *
 * For v1 the renderers are deterministic templates that organise the *
 * captured answers into LLM-readable text. For v2 we can swap any    *
 * individual renderer for a Claude-synthesized prose version without *
 * changing the surrounding pipeline.                                 *
 * ------------------------------------------------------------------ */

const README: BrandPackFile = {
  name: "0_README.txt",
  phase: 0,
  scope: "universal",
  mode: "claude",
  synthesisPrompt: (ctx) =>
    `Write the file body for **0_README.txt** — the entry point of the brand pack. It tells the user what this pack is, how to use it with an LLM (Claude Projects, ChatGPT GPTs, Gemini Gems), what each file does, and notes for editing.

# Required sections (in order, with these exact \`##\` headings):
- What this pack is
- How to use it
- File order
- Locales
- Notes for editing

# Title (top of file, with a single \`#\`)
README · brand pack

# Brand metadata you must reference correctly
- Brand name: ${ctx.brand.brand_name}
- Primary locale: ${ctx.brand.locale_primary}
- Secondary locale: ${ctx.brand.locale_secondary ?? "(none)"}

# Tone
This file is read by a human first (the brand owner or their operator). Friendly but professional. No hype. The voice you use here should still respect the brand's voice rules even though the file itself is meta.

# CRITICAL: how custom instructions are delivered
The custom instructions block (the text that goes into the LLM's "Instructions" field) IS NOT IN THIS ZIP. It arrives inline in the delivery email. Explain this clearly in the "How to use it" section:
- Step 1: the user copies the custom-instructions block from the email and pastes it into Claude Project Instructions / ChatGPT GPT Instructions / Gemini Gem Instructions.
- Step 2: the user uploads every file in this zip to the LLM project as knowledge / project files.
- Warn explicitly that the custom-instructions block must NEVER be uploaded as a knowledge file. It belongs in the instructions field. If attached as a file, the LLM treats it as searchable context, which dilutes its authority.

# File list to reference in the "File order" section (per-locale files exist once per supported locale)
\`0_README.txt\` · \`10_BRAND_CORE_<locale>.txt\` · \`11_AUDIENCE_<locale>.txt\` · \`12_PILLARS_<locale>.txt\` · \`20_VOICE_CORE_<locale>.txt\` · \`21_VOICE_FLEX_<locale>.txt\` · \`22_LEXICON_<locale>.txt\` · \`30_CHANNEL_SPECS_<locale>.txt\` · \`31_EXAMPLES_LIBRARY_<locale>.txt\`

The zip does NOT contain \`0_CUSTOM_INSTRUCTIONS.txt\`. Do not include it in the file order list. The custom instructions live in the delivery email.

Produce only the file body. Markdown.`,
  render: (ctx) =>
    [
      fileHeader(
        ctx,
        "README — brand pack",
        "How to use the files in this pack with an LLM (Claude Projects, ChatGPT Custom GPT, Gemini Gems, etc.).",
      ),
      section("What this pack is"),
      `A 12-file brand DNA pack capturing the structural identity of ${ctx.brand.brand_name}. Each file covers one dimension (foundation, audience, pillars, voice, lexicon, channel specs, examples). Upload the full set to your LLM of choice so it can produce on-brand content without re-explaining the brand each session.`,
      section("How to use it"),
      `1. Create a new Project / Custom GPT / Gem.
2. Attach every file in this pack as project knowledge.
3. Paste the contents of \`0_USAGE_GUIDE.txt\` into the system prompt / project instructions.
4. Ask the LLM for whatever you need — captions, emails, decks, internal memos. It will produce text that respects this brand's voice, pillars and lexicon.`,
      section("File order"),
      `- \`0_README.txt\` — this file
- \`0_USAGE_GUIDE.txt\` — system prompt for the host LLM
- \`10_BRAND_CORE.txt\` — what the brand is, what problem it solves
- \`11_AUDIENCE.txt\` — who it serves and who it doesn't
- \`12_PILLARS.txt\` — the few specific things the brand does
- \`20_VOICE_CORE.txt\` — universal voice rules
- \`21_VOICE_FLEX_<locale>.txt\` — per-locale register samples + playbooks
- \`22_LEXICON_<locale>.txt\` — signature phrases, substitutions, banned terms
- \`30_CHANNEL_SPECS_<locale>.txt\` — channel-by-channel formatting rules
- \`31_EXAMPLES_LIBRARY_<locale>.txt\` — finished example outputs to learn from`,
      section("Locales"),
      ctx.brand.locale_secondary
        ? `Primary: ${ctx.brand.locale_primary} · Secondary: ${ctx.brand.locale_secondary}`
        : `Primary: ${ctx.brand.locale_primary}`,
      section("Notes for editing"),
      `Treat these files as living documents. If the brand evolves, edit the relevant file directly and re-upload. The LLM will pick up the change on its next session.`,
    ].join("\n"),
};

const USAGE_GUIDE: BrandPackFile = {
  name: "0_CUSTOM_INSTRUCTIONS.txt",
  phase: 0,
  scope: "universal",
  mode: "claude",
  synthesisPrompt: (ctx) =>
    `Write the file body for **0_CUSTOM_INSTRUCTIONS.txt** — the block of text that goes into the host LLM's instructions field (Claude Project Instructions, ChatGPT GPT Instructions, Gemini Gem Instructions). The actual delivery to the client happens through the email body, where this same content is embedded inline for one-click copy. The reader of THIS section is the host LLM, not the operator. Everything after the BEGIN marker should be ready to paste with zero edits.

# Required structure
Start with one short pre-marker paragraph in plain English explaining what this file is, where it gets pasted, and that it should NEVER be uploaded as a knowledge / project file because that would dilute its authority (the LLM would treat it as searchable context instead of as a top-level rule set).
Then a clearly visible separator line (use the literal string: ─── BEGIN CUSTOM INSTRUCTIONS ───).
Then the actual instructions block, addressed to the LLM in second person.
Then a closing separator (─── END CUSTOM INSTRUCTIONS ───).

# Sections inside the instructions block (in order, with \`##\` headings)
- Role
- Hard rules (override training preferences)
- When asked for off-brand content

# Brand metadata
- Brand name: ${ctx.brand.brand_name}
- Primary locale: ${ctx.brand.locale_primary}
${ctx.brand.locale_secondary ? `- Secondary locale: ${ctx.brand.locale_secondary}` : ""}

# Constraints
- Write the Role section starting with "You are the in-house writer for ${ctx.brand.brand_name}…" and direct the LLM to load the rest of the pack files before producing content.
- Hard rules must enumerate, with examples: no em-dashes, no clichés (give the same blocklist), no invention, no biographical-to-structural extrapolation, voice rules from 20_VOICE_CORE override defaults, ask when uncertain. Apply the lexicon substitutions from 22_LEXICON_<locale>.
- Off-brand section must reference \`q4_8\` refusal templates in \`21_VOICE_FLEX_<locale>\` and instruct the LLM not to fabricate positions.
- File references use canonical names: \`10_BRAND_CORE\`, \`11_AUDIENCE\`, \`12_PILLARS\`, \`20_VOICE_CORE\`, \`21_VOICE_FLEX_<locale>\`, \`22_LEXICON_<locale>\`, \`30_CHANNEL_SPECS_<locale>\`, \`31_EXAMPLES_LIBRARY_<locale>\`.

Produce only the file body. Markdown.`,
  render: (ctx) =>
    [
      fileHeader(
        ctx,
        "USAGE GUIDE — paste into the LLM's system prompt",
        "Instructions for the host LLM on how to interpret and use this brand pack.",
      ),
      section("System prompt"),
      `You are the in-house writer for ${ctx.brand.brand_name}. Your job is to produce text that respects the brand defined by the attached pack:

- \`10_BRAND_CORE\` defines what the brand IS and what problem it solves. Never contradict it.
- \`11_AUDIENCE\` defines who you write for and who you do NOT write for. If a request asks for a non-target audience, push back and surface the gap.
- \`12_PILLARS\` defines the few specific things the brand does. Every output should ladder up to at least one pillar's mechanism. If a request doesn't, say so.
- \`20_VOICE_CORE\` defines the universal voice rules. They are not stylistic preferences — they are constraints. Comply.
- \`21_VOICE_FLEX_<locale>\` gives you register samples (precise / considered / conversational / accountable) per locale + a sensitive-situations playbook (delays, complaints, refunds, etc.). Match the register to the situation.
- \`22_LEXICON_<locale>\` lists signature phrases the brand owns and substitutions (use X instead of Y). Apply rigorously. Also lists brand-specific banned terms — do not produce them.
- \`30_CHANNEL_SPECS_<locale>\` gives channel-by-channel rules (forbidden openings, hashtag policy, emoji policy). Respect them.
- \`31_EXAMPLES_LIBRARY_<locale>\` shows finished outputs in the brand's voice. Learn from the pattern.`,
      section("Hard rules (override training preferences)"),
      `1. No em-dashes (—). Use a period, comma, parentheses or hyphen instead.
2. No marketing clichés ("transform", "leader in", "innovative", "seamless", "comprehensive", "world-class", "best-in-class", "next-generation", "revolutionary", "groundbreaking", "leverage", "holistic", "synergy", "unlock", "journey", "reimagine", "end-to-end"). Strike them and reach for the structural mechanism instead.
3. No biographical → structural extrapolation. A CEO name does not license "founder-led". A team-page line does not license "boutique". Stick to what \`10_BRAND_CORE\` and \`11_AUDIENCE\` explicitly state.
4. Voice rules from \`20_VOICE_CORE\` override your model's default style. Read them before generating.
5. When uncertain, ask the user. Never invent facts about the brand.`,
      section("When asked for off-brand content"),
      `If a request is off-domain (asking about topics this brand has no position on), use the off-domain refusal template from \`21_VOICE_FLEX_<locale>\` (q4_8). Do not fabricate a position.`,
    ].join("\n"),
};

const BRAND_CORE: BrandPackFile = {
  name: "10_BRAND_CORE_[LOCALE].txt",
  phase: 1,
  scope: "per_locale",
  mode: "claude",
  synthesisPrompt: (ctx) => {
    const phase1 = (ctx.answers.phase_1 as Record<string, unknown>) ?? {};
    const locale = ctx.locale!;
    const localeIsPrimary = locale === ctx.brand.locale_primary;
    return `Write the file body for **10_BRAND_CORE_${locale}.txt** — the foundational file describing what this brand IS and what problem it solves.

# Locale of this file
This file is written **entirely in ${locale.toUpperCase()}**. Do not mix locales. Every section, every sentence, every list item, must be in ${locale.toUpperCase()}.
${localeIsPrimary ? `This is the brand's primary locale. Use the answers verbatim where they exist in this locale.` : `This is the brand's SECONDARY locale. Most fields were written by the user in their primary locale (${ctx.brand.locale_primary}). Translate the structural content naturally into ${locale.toUpperCase()} when needed. Preserve named entities (brand name, place names, legal entity names) verbatim. Translate only descriptive prose.`}

# Title
10 · BRAND CORE

# Required sections (in order, exact \`##\` headings, all in ${locale.toUpperCase()})
- Distillation
- Brand identity
- Organization
- The problem
- How the brand resolves it
- Value chain
- Category
- Structural distinctions
- What the brand is not
- Structural outcomes
- Founder notes (ONLY include this section if q7_final.notes is non-empty; otherwise omit entirely, including the heading)

# How to fill each section
- **Distillation**: 50-100 words. If \`q1_11.${locale}\` exists, use it verbatim. Otherwise translate \`q1_11.${ctx.brand.locale_primary}\` into ${locale.toUpperCase()} naturally.
- **Brand identity**: 80-150 words of prose synthesizing q1_1 + q1_3. Connected sentences, not key/value. Named entities verbatim, descriptive prose in ${locale.toUpperCase()}.
- **Organization**: 40-80 words from \`q1_org\`. One sentence on company shape (size band, founded year if present, HQ / locations). One sentence on which teams own brand-facing content. Plain English in ${locale.toUpperCase()}, never just a key/value dump. If brand-content owners are not stated, omit that sentence entirely rather than guessing. This section sets the register for everything Claude / ChatGPT / Gemini will write downstream: a solo founder reads differently from a 200-person platform with a Marketing team.
- **Founder notes** (CONDITIONAL): If \`q7_final.notes\` is empty or whitespace, OMIT this section entirely (no heading, nothing). If it has content, render the user's note verbatim under a brief 1-sentence framing line like "Additional context provided by the brand owner:" in ${locale.toUpperCase()}. Translate the framing line if the file is in a secondary locale; do NOT translate the note itself (it's a direct quote from the founder).
- **How the brand resolves it**: 40-80 words. Lead with q1_5.resolution.
- **Value chain**: numbered list of q1_6_stages. Translate each stage label naturally into ${locale.toUpperCase()} if needed. Then a 30-50 word paragraph weaving q1_6_effects.
- **Category**: 30-60 words. q1_7.category + bulleted q1_7_axes.
- **Structural distinctions**: 60-120 word intro then bulleted q1_8 items.
- **What the brand is not**: bulleted q1_9 items in ${locale.toUpperCase()}. One-sentence intro.
- **Structural outcomes**: 30-60 word intro then bulleted q1_10 items.

# Forbidden character
The em-dash character (—) is BANNED. Use period, comma, parentheses or hyphen.

# Answers (phase 1)
\`\`\`json
${JSON.stringify(phase1, null, 2)}
\`\`\`

Produce only the file body in ${locale.toUpperCase()}. Markdown.`;
  },
  render: (ctx) => {
    const a = ctx.answers;
    const q1_1 = (q(a, 1, "q1_1") as Record<string, unknown>) ?? {};
    const q1_3 = (q(a, 1, "q1_3") as Record<string, unknown>) ?? {};
    const q1_4 = (q(a, 1, "q1_4") as Record<string, unknown>) ?? {};
    const q1_4b = l(q(a, 1, "q1_4b"));
    const q1_5 = (q(a, 1, "q1_5") as Record<string, unknown>) ?? {};
    const q1_6_stages = l(q(a, 1, "q1_6_stages"));
    const q1_6_effects = l(q(a, 1, "q1_6_effects"));
    const q1_7 = (q(a, 1, "q1_7") as Record<string, unknown>) ?? {};
    const q1_7_axes = l(q(a, 1, "q1_7_axes"));
    const q1_8 = l(q(a, 1, "q1_8"));
    const q1_9 = l(q(a, 1, "q1_9"));
    const q1_10 = l(q(a, 1, "q1_10"));
    const q1_11 = (q(a, 1, "q1_11") as Record<string, unknown>) ?? {};
    const q1_org = (q(a, 1, "q1_org") as Record<string, unknown>) ?? {};
    const distillation =
      s(q1_11[ctx.brand.locale_primary]) ??
      Object.values(q1_11).find((v) => typeof v === "string") ??
      "";

    return [
      fileHeader(
        ctx,
        "10 · BRAND CORE",
        "What this brand is, what problem it solves, and on what structural grounds.",
      ),
      section("Distillation"),
      distillation,
      section("Brand identity"),
      defList(
        {
          "Brand name": q1_1.brand_name,
          "Legal entity": q1_3.name,
          "Entity type": q1_3.type,
          Structure: q1_3.structure,
          Focus: q1_3.focus,
          Region: q1_3.region,
          Specialization: q1_3.specialization,
          "Primary locale": q1_1.locale_primary,
          "Secondary locale": q1_1.locale_secondary,
        },
      ),
      section("Organization"),
      defList({
        "Team size": q1_org.size_band,
        Founded: q1_org.founded_year,
        Location: q1_org.hq_location,
        Teams: q1_org.departments,
        "Primary brand-content owners": q1_org.brand_owners,
      }),
      section("The problem"),
      s(q1_4.problem),
      `\n**Specific causes (mechanisms, not feelings):**`,
      bullets(q1_4b),
      section("How the brand resolves it"),
      s(q1_5.resolution),
      section("Value chain"),
      `**Stages (in order):**`,
      numbered(q1_6_stages),
      `\n**Observable effects of organizing this way:**`,
      bullets(q1_6_effects),
      section("Category"),
      s(q1_7.category),
      `\n**Axes buyers weigh in this category:**`,
      bullets(q1_7_axes),
      section("Structural distinctions (what competitors can't do)"),
      `Each item below fails the "could a competitor say this?" test — it depends on something structural to this brand.`,
      ``,
      bullets(q1_8),
      section("What the brand is NOT"),
      bullets(q1_9),
      section("Structural outcomes for customers"),
      `Not experience-language. Observable, measurable, or contractually defendable.`,
      ``,
      bullets(q1_10),
      ...renderFounderNotes(a),
    ].join("\n");
  },
};

/**
 * Optional "Founder notes" tail for BRAND CORE. Returns an empty array
 * when q7_final.notes is missing or whitespace, so the section is
 * cleanly omitted (no heading, no blank scaffold). Renders the user's
 * note verbatim under a brief framing line.
 */
function renderFounderNotes(answers: Record<string, unknown>): string[] {
  const q7_final = (q(answers, 7, "q7_final") as Record<string, unknown>) ?? {};
  const notes = typeof q7_final.notes === "string" ? q7_final.notes.trim() : "";
  if (!notes) return [];
  return [
    section("Founder notes"),
    "Additional context provided by the brand owner. Treat as authoritative when generating content or evaluating proposals:",
    "",
    notes,
  ];
}

const AUDIENCE: BrandPackFile = {
  name: "11_AUDIENCE_[LOCALE].txt",
  phase: 2,
  scope: "per_locale",
  mode: "claude",
  synthesisPrompt: (ctx) => {
    const phase2 = (ctx.answers.phase_2 as Record<string, unknown>) ?? {};
    const locale = ctx.locale!;
    const localeIsPrimary = locale === ctx.brand.locale_primary;
    return `Write the file body for **11_AUDIENCE_${locale}.txt** — who this brand serves, who it doesn't, and on what condition they commit.

# Locale of this file
This file is written **entirely in ${locale.toUpperCase()}**. Do not mix locales. ${localeIsPrimary ? "Primary locale: use answers verbatim where possible." : `Secondary locale: translate descriptive prose into ${locale.toUpperCase()}. Preserve segment names and named entities.`}

# Title
11 · AUDIENCE

# Required sections (in order)
- Primary insight
- Segments
- Conditions true across all segments
- Non-targets (and why)
- Commit conditions

# How to fill each section
- **Primary insight**: 40-80 words. Lead with q2_1.primary_insight as the anchor sentence, then q2_1.consequence as the structural follow-on. One short paragraph.
- **Segments**: for EACH segment in q2_2.segments, produce a \`### <segment_name>\` heading. Mark the primary segment with " · PRIMARY" suffix. Inside each segment, prose-render in this order:
  1. Trigger phrases — bulleted list using ONLY \`q2_3.<seg>.name_and_triggers.${locale}\`. Do NOT include the other locale's list.
  2. Structural conditions — bulleted list of q2_3.<seg>.structural_conditions, translated into ${locale.toUpperCase()} if needed.
  3. A short paragraph (30-60 words) weaving financial_position + stage_of_life + primary_condition.
  4. Core problem — one bolded line.
  5. Drivers and Non-drivers — two separate bulleted lists, each with a sentence intro.
  6. System fit + Why this segment matters — one paragraph each (30-50 words).
- **Conditions true across all segments**: bulleted list of q2_4 verbatim. One-sentence intro.
- **Non-targets**: for each q2_5 item, a sub-bullet with the description bolded and the reason_for_exclusion as italic. One-sentence intro warning these are deliberate exclusions, not oversights.
- **Commit conditions**: three labeled paragraphs (access / structure / confidence) using q2_6 verbatim, each 20-40 words.

# Answers (phase 2)
\`\`\`json
${JSON.stringify(phase2, null, 2)}
\`\`\`

Produce only the file body. Markdown.`;
  },
  render: (ctx) => {
    const a = ctx.answers;
    const q2_1 = (q(a, 2, "q2_1") as Record<string, unknown>) ?? {};
    const q2_2 = (q(a, 2, "q2_2") as Record<string, unknown>) ?? {};
    const q2_3 = (q(a, 2, "q2_3") as Record<string, unknown>) ?? {};
    const q2_4 = l(q(a, 2, "q2_4"));
    const q2_5 = (q(a, 2, "q2_5") as Array<Record<string, unknown>>) ?? [];
    const q2_6 = (q(a, 2, "q2_6") as Record<string, unknown>) ?? {};

    const segments =
      (q2_2.segments as Array<{ id: string; name: string }>) ?? [];
    const primaryId = q2_2.primary_segment_id as string | undefined;

    const segmentBlocks = segments
      .map((seg) => {
        const detail = (q2_3[seg.id] as Record<string, unknown>) ?? {};
        const triggers = detail.name_and_triggers as
          | Record<string, string[]>
          | undefined;
        const triggerLines = triggers
          ? Object.entries(triggers)
              .map(
                ([loc, list]) =>
                  `_${loc}:_\n${bullets(list ?? [])}`,
              )
              .join("\n\n")
          : "_(none captured)_";
        const isPrimary = seg.id === primaryId;
        return [
          `### ${seg.name}${isPrimary ? "  ·  PRIMARY" : ""}`,
          ``,
          `**Trigger phrases (when this person is open to us):**`,
          triggerLines,
          ``,
          `**Structural conditions:**`,
          bullets(l(detail.structural_conditions)),
          ``,
          `**Financial position:** ${s(detail.financial_position)}`,
          `**Life stage:** ${s(detail.stage_of_life)}`,
          `**Primary condition:** ${s(detail.primary_condition)}`,
          ``,
          `**Core problem (structural, not aspirational):** ${s(detail.core_problem)}`,
          ``,
          `**Drivers:**`,
          bullets(l(detail.drivers)),
          ``,
          `**Non-drivers (do NOT lead with these):**`,
          bullets(l(detail.non_drivers)),
          ``,
          `**System fit:** ${s(detail.system_fit)}`,
          `**Why this segment matters:** ${s(detail.why_segment_matters)}`,
        ].join("\n");
      })
      .join("\n\n---\n\n");

    return [
      fileHeader(
        ctx,
        "11 · AUDIENCE",
        "Who this brand serves, who it doesn't, and on what condition they commit.",
      ),
      section("Primary insight"),
      `**Insight:** ${s(q2_1.primary_insight)}`,
      `**Consequence:** ${s(q2_1.consequence)}`,
      section("Segments"),
      segmentBlocks || "_(no segments captured)_",
      section("Conditions true across all segments"),
      bullets(q2_4),
      section("Non-targets (and why)"),
      q2_5.length === 0
        ? "_(none captured)_"
        : q2_5
            .map(
              (item) =>
                `- **${s(item.description)}**\n  _Reason:_ ${s(item.reason_for_exclusion)}`,
            )
            .join("\n"),
      section("Commit conditions"),
      defList({
        "Access condition": q2_6.access_condition,
        "Structure condition": q2_6.structure_condition,
        "Confidence condition": q2_6.confidence_condition,
      }),
    ].join("\n");
  },
};

const PILLARS: BrandPackFile = {
  name: "12_PILLARS_[LOCALE].txt",
  phase: 3,
  scope: "per_locale",
  mode: "claude",
  synthesisPrompt: (ctx) => {
    const phase3 = (ctx.answers.phase_3 as Record<string, unknown>) ?? {};
    const locale = ctx.locale!;
    const localeIsPrimary = locale === ctx.brand.locale_primary;
    return `Write the file body for **12_PILLARS_${locale}.txt** — the few specific things this brand does, with the conditions under which each applies and is refused.

# Locale of this file
**Entirely in ${locale.toUpperCase()}.** Do not mix locales. ${localeIsPrimary ? "Primary locale: use answers verbatim." : `Secondary locale: translate prose into ${locale.toUpperCase()}; preserve named entities, segment ids, and the structural numbers/labels.`}

# Title
12 · PILLARS

# Required sections (in order)
- Pillars
- Pillar tensions and resolutions
- Meta-rule (when nothing else applies)

# How to fill each section
- **Pillars**: for EACH pillar in q3_1.pillars, produce a \`### <pillar_name>\` block. Inside, prose-render:
  1. A one-paragraph synthesis (60-100 words) of the problem this pillar addresses, the mechanism (the specific operational thing the brand does), and the effect (what measurably changes). Use the q3_2.<pillar_id>.problem, .mechanism, and .effect fields verbatim where they make grammatical sense.
  2. **Accept this pillar when**: bulleted list of accept_when items verbatim.
  3. **REJECT this pillar when**: bulleted list of reject_when items verbatim. State explicitly this is the most consequential field.
  4. Context weights as a single line: \`Context weights (0-5): SALES: X · INVESTOR: X · TECHNICAL: X · COMMUNITY: X · INTERNAL: X\`.
  5. Segment modifiers as a single line: \`Segment modifiers (-2 to +2): <segment>: X · <segment>: X · ...\`.
- **Pillar tensions and resolutions**: for each q3_3 item, a bulleted block: tension (bolded), interpretation (italic), resolution rule (one sentence). One-paragraph intro acknowledging that tensions exist when pillars compete.
- **Meta-rule**: 30-60 words. Quote q3_4 verbatim with light prose framing if needed.

# Answers (phase 3)
\`\`\`json
${JSON.stringify(phase3, null, 2)}
\`\`\`

Produce only the file body. Markdown.`;
  },
  render: (ctx) => {
    const a = ctx.answers;
    const q3_1 = (q(a, 3, "q3_1") as Record<string, unknown>) ?? {};
    const q3_2 = (q(a, 3, "q3_2") as Record<string, unknown>) ?? {};
    const q3_3 = (q(a, 3, "q3_3") as Array<Record<string, unknown>>) ?? [];
    const q3_4 = s(q(a, 3, "q3_4"));

    const pillars =
      (q3_1.pillars as Array<{ id: string; name: string }>) ?? [];

    const pillarBlocks = pillars
      .map((p) => {
        const d = (q3_2[p.id] as Record<string, unknown>) ?? {};
        const cw = (d.context_weights as Record<string, number>) ?? {};
        const sm = (d.segment_modifiers as Record<string, number>) ?? {};
        return [
          `### ${p.name}`,
          ``,
          `**Problem this pillar addresses:** ${s(d.problem)}`,
          ``,
          `**Mechanism (the specific operational thing):** ${s(d.mechanism)}`,
          ``,
          `**Effect (what measurably changes):** ${s(d.effect)}`,
          ``,
          `**Accept this pillar when:**`,
          bullets(l(d.accept_when)),
          ``,
          `**REJECT this pillar when** (the most consequential field — be specific):`,
          bullets(l(d.reject_when)),
          ``,
          `**Context weights (0-5):** ${Object.entries(cw)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ")}`,
          `**Segment modifiers (-2 to +2):** ${Object.entries(sm)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ")}`,
        ].join("\n");
      })
      .join("\n\n---\n\n");

    return [
      fileHeader(
        ctx,
        "12 · PILLARS",
        "The few specific things this brand does, with the conditions under which each applies and is refused.",
      ),
      section("Pillars"),
      pillarBlocks || "_(no pillars captured)_",
      section("Pillar tensions and resolutions"),
      q3_3.length === 0
        ? "_(none captured)_"
        : q3_3
            .map(
              (t) =>
                `- **Tension:** ${s(t.tension)}\n  **Interpretation:** ${s(t.interpretation)}\n  **Resolution rule:** ${s(t.resolution_rule)}`,
            )
            .join("\n"),
      section("Meta-rule (when nothing else applies)"),
      q3_4,
    ].join("\n");
  },
};

const VOICE_CORE: BrandPackFile = {
  name: "20_VOICE_CORE_[LOCALE].txt",
  phase: 4,
  scope: "per_locale",
  render: (ctx) => {
    const a = ctx.answers;
    const q4_1 = l(q(a, 4, "q4_1"));
    const q4_2 = l(q(a, 4, "q4_2"));
    const q4_3 = s(q(a, 4, "q4_3"));
    const q4_4 = l(q(a, 4, "q4_4"));
    const q4_5 = (q(a, 4, "q4_5") as Record<string, unknown>) ?? {};

    return [
      fileHeader(
        ctx,
        `20 · VOICE CORE · ${ctx.locale!.toUpperCase()}`,
        "Voice rules applying to this locale across every channel, register and situation.",
      ),
      section("Identity descriptors (the voice's edge)"),
      bullets(q4_1),
      section("Texture traits (how sentences feel)"),
      bullets(q4_2),
      section("The single irreducible voice rule"),
      `> ${q4_3}`,
      section("Punctuation and emphasis policy"),
      defList(q4_5, {
        em_dashes: "Em-dashes",
        exclamation_marks: "Exclamation marks",
        all_caps_emphasis: "ALL CAPS emphasis",
        oxford_comma: "Oxford comma",
        heading_case: "Heading case",
        emoji_policy: "Emoji policy",
      }),
      section("Brand-specific forbidden phrases"),
      q4_4.length === 0
        ? "_None beyond the universal blocklist._"
        : bullets(q4_4),
      section("Universal blocklist (apply always)"),
      `These cliché markers are forbidden in every output regardless of locale or register:`,
      ``,
      `transform · leader in · innovative · seamless · comprehensive · world-class · best-in-class · next-generation · revolutionary · groundbreaking · leverage · holistic · synergy · unlock · journey · reimagine · end-to-end · cutting-edge · state-of-the-art`,
    ].join("\n");
  },
};

const VOICE_FLEX: BrandPackFile = {
  name: "21_VOICE_FLEX_[LOCALE].txt",
  phase: 4,
  scope: "per_locale",
  render: (ctx) => {
    const a = ctx.answers;
    const locale = ctx.locale!;
    const q4_6 = perLocale(q(a, 4, "q4_6"), locale) as
      | Record<string, string>
      | undefined;
    const q4_7 = perLocale(q(a, 4, "q4_7"), locale) as
      | Record<string, string>
      | undefined;
    const q4_8 = perLocale(q(a, 4, "q4_8"), locale) as
      | Record<string, string>
      | undefined;

    return [
      fileHeader(
        ctx,
        `21 · VOICE FLEX · ${locale.toUpperCase()}`,
        "Register samples (precise / considered / conversational / accountable) plus the sensitive-situations playbook and off-domain refusal templates. Written natively in this locale.",
      ),
      section("Register samples"),
      `Use these as anchors. Match the register to the situation: precise for technical, considered for thought-leadership, conversational for community, accountable for sensitive moments.`,
      ``,
      `### Precise\n\n${s(q4_6?.precise)}`,
      ``,
      `### Considered\n\n${s(q4_6?.considered)}`,
      ``,
      `### Conversational\n\n${s(q4_6?.conversational)}`,
      ``,
      `### Accountable\n\n${s(q4_6?.accountable)}`,
      section("Sensitive-situations playbook"),
      `For each situation below, the response is calibrated to the brand's voice and accountability stance. Use as a template when these situations arise.`,
      ``,
      `### Delays\n\n${s(q4_7?.delays)}`,
      ``,
      `### Complaints\n\n${s(q4_7?.complaints)}`,
      ``,
      `### Price changes\n\n${s(q4_7?.price_changes)}`,
      ``,
      `### Closures\n\n${s(q4_7?.closures)}`,
      ``,
      `### Refunds\n\n${s(q4_7?.refunds)}`,
      section("Off-domain refusal templates"),
      `When asked for content on a topic this brand has no structural position on, use one of these templates. They contain placeholders \`[BRAND_NAME]\` (replace with the brand name) and \`[TOPIC]\` (replace with the off-domain topic).`,
      ``,
      `### Precise refusal\n\n${s(q4_8?.precise)}`,
      ``,
      `### Considered refusal\n\n${s(q4_8?.considered)}`,
      ``,
      `### Conversational refusal\n\n${s(q4_8?.conversational)}`,
      ``,
      `### Accountable refusal\n\n${s(q4_8?.accountable)}`,
    ].join("\n");
  },
};

const LEXICON: BrandPackFile = {
  name: "22_LEXICON_[LOCALE].txt",
  phase: 5,
  scope: "per_locale",
  render: (ctx) => {
    const a = ctx.answers;
    const locale = ctx.locale!;
    const q5_1 = l(perLocale(q(a, 5, "q5_1"), locale));
    const q5_2 = (perLocale(q(a, 5, "q5_2"), locale) as Array<
      Record<string, unknown>
    >) ?? [];
    const q5_3 = (q(a, 5, "q5_3") as Record<string, unknown>) ?? {};
    const q5_4 = (perLocale(q(a, 5, "q5_4"), locale) as Array<
      Record<string, unknown>
    >) ?? [];

    return [
      fileHeader(
        ctx,
        `22 · LEXICON · ${locale.toUpperCase()}`,
        "Words and phrases the brand owns, prefers, and refuses.",
      ),
      section("Signature phrases (the brand owns these)"),
      bullets(q5_1),
      section("Preferred substitutions"),
      q5_2.length === 0
        ? "_(none captured)_"
        : q5_2
            .map(
              (s_) =>
                `- Use **"${s(s_.use)}"** instead of "${s(s_.instead_of)}"`,
            )
            .join("\n"),
      section("Punctuation"),
      `Quotation marks: **${s(q5_3.quotation_marks)}**`,
      section("Brand-specific banned terms"),
      q5_4.length === 0
        ? "_(none beyond the universal blocklist)_"
        : q5_4
            .map(
              (b) =>
                `### "${s(b.term)}"\n\n**Why it fails:** ${s(b.why_it_fails)}\n\n**Bad example:** ${s(b.bad_example)}\n\n**Better version:** ${s(b.better_version)}`,
            )
            .join("\n\n"),
    ].join("\n");
  },
};

const CHANNEL_SPECS: BrandPackFile = {
  name: "30_CHANNEL_SPECS_[LOCALE].txt",
  phase: 6,
  scope: "per_locale",
  render: (ctx) => {
    const a = ctx.answers;
    const locale = ctx.locale!;
    const q6_2 = l(perLocale(q(a, 6, "q6_2"), locale));
    const q6_3 = (q(a, 6, "q6_3") as Record<string, unknown>) ?? {};
    const q6_4 = (q(a, 6, "q6_4") as Record<string, unknown>) ?? {};
    // q6_6 supports both shapes: a per-locale dict { pt: [...], en: [...] }
    // OR a flat list (legacy). perLocale() handles both gracefully —
    // returns the locale's list when keyed, or undefined for a flat list,
    // in which case we fall back to the flat array.
    const q6_6_raw = q(a, 6, "q6_6");
    const q6_6 = Array.isArray(q6_6_raw)
      ? l(q6_6_raw)
      : l(perLocale(q6_6_raw, locale));

    return [
      fileHeader(
        ctx,
        `30 · CHANNEL SPECS · ${locale.toUpperCase()}`,
        "Channel-by-channel formatting rules. Apply on top of the universal voice rules in 20_VOICE_CORE.",
      ),
      section("Forbidden opening phrases"),
      q6_2.length === 0
        ? "_(none captured beyond universal voice rules)_"
        : bullets(q6_2),
      section("Hashtag policy"),
      defList(q6_3, {
        instagram_enabled: "Hashtags on Instagram",
        linkedin_enabled: "Hashtags on LinkedIn",
      }),
      section("Emoji policy"),
      defList(q6_4, {
        instagram: "Instagram",
        linkedin: "LinkedIn",
        email: "Email",
        internal: "Internal",
      }),
      section("Cross-channel rules"),
      q6_6.length === 0 ? "_(none captured)_" : bullets(q6_6),
    ].join("\n");
  },
};

const EXAMPLES_LIBRARY: BrandPackFile = {
  name: "31_EXAMPLES_LIBRARY_[LOCALE].txt",
  phase: 7,
  scope: "per_locale",
  render: (ctx) => {
    const a = ctx.answers;
    const locale = ctx.locale!;
    const q7_1 = s(q(a, 7, "q7_1"));
    const q7_2 = (q(a, 7, "q7_2") as Array<Record<string, unknown>>) ?? [];

    const exampleBlocks = q7_2
      .filter((ex) => !ex.locale || ex.locale === locale)
      .map(
        (ex, i) =>
          `### Example ${i + 1}${ex.channel ? ` · ${s(ex.channel)}` : ""}\n\n` +
          `**Prompt:** ${s(ex.prompt)}\n\n` +
          `**Pillars invoked:** ${l(ex.pillars_invoked).join(", ") || "—"}\n\n` +
          `**Output:**\n\n${s(ex.output)}\n\n` +
          `**Why it works:** ${s(ex.why_it_works)}\n\n` +
          `**Common traps avoided:** ${s(ex.common_traps_avoided)}`,
      )
      .join("\n\n---\n\n");

    return [
      fileHeader(
        ctx,
        `31 · EXAMPLES LIBRARY · ${locale.toUpperCase()}`,
        "Finished example outputs in the brand's voice. Use them as references when producing similar pieces.",
      ),
      section("Commitment level"),
      `\`${q7_1}\``,
      section("Examples"),
      exampleBlocks ||
        "_No examples captured yet. The brand chose to skip the examples library; you can still produce on-brand outputs using the voice, lexicon and pillars files._",
    ].join("\n");
  },
};

/* ------------------------------------------------------------------ */

export const FILE_REGISTRY: BrandPackFile[] = [
  README,
  USAGE_GUIDE,
  BRAND_CORE,
  AUDIENCE,
  PILLARS,
  VOICE_CORE,
  VOICE_FLEX,
  LEXICON,
  CHANNEL_SPECS,
  EXAMPLES_LIBRARY,
];

/** Substitute the [LOCALE] placeholder in a per-locale file name. */
export function fileNameForLocale(
  template: string,
  locale: string,
): string {
  return template.replace("[LOCALE]", locale.toLowerCase());
}

/** Expand the file registry against the brand's locale set. Universal
 * files appear once; per-locale files expand to one entry per supported
 * locale. */
export function expandRegistry(
  primaryLocale: string,
  secondaryLocale: string | null,
): Array<{ name: string; file: BrandPackFile; locale: string | null }> {
  const locales = [primaryLocale, secondaryLocale].filter(
    (l): l is string => Boolean(l),
  );
  const out: Array<{ name: string; file: BrandPackFile; locale: string | null }> =
    [];
  for (const file of FILE_REGISTRY) {
    if (file.scope === "universal") {
      out.push({ name: file.name, file, locale: null });
    } else {
      for (const locale of locales) {
        out.push({
          name: fileNameForLocale(file.name, locale),
          file,
          locale,
        });
      }
    }
  }
  return out;
}

/** Convenience: render one (file, locale) pair given the full context. */
export function renderFile(
  file: BrandPackFile,
  ctx: RenderContext,
): string {
  return file.render(ctx).trim() + "\n";
}

/** Allow the admin layer to introspect the answers when needed. */
export { ph, perLocale };
