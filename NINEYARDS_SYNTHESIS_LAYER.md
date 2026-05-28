# ai brand engine — Synthesis Layer

> The layer that sits between raw interview answers and final file
> content. Without this, generated files have correct STRUCTURE but
> uncertain CONTENT QUALITY — a user typing a sloppy answer would
> see that sloppy text appear in their brand DNA file.
>
> The synthesis layer enforces the framework's quality rules
> (mechanism-first, no AI clichés, structural answers, etc.) at
> file generation time, not just at interview time.
>
> Companion to NINEYARDS_INTERVIEW_FULL.md and
> NINEYARDS_FILE_TEMPLATES.md.

---

# Why synthesis is needed

## The problem

Interview answers are captured from non-expert users who may not consistently produce framework-compliant text. The framework requires:

- Mechanism-first phrasing ("housing is expensive because production is fragmented" not "housing is expensive")
- No AI-default clichés (no "innovative", "leading", "comprehensive")
- No aspirational claims without mechanism backing
- Structural rather than aspirational descriptions
- Consistent voice across all sections
- Native-language quality per locale (not translated)

Interview validation catches some violations (blocklist scans, format rules) but can't enforce quality nuances. A user can produce a technically-non-blocklisted answer that's still weak — vague, non-mechanistic, or off-voice.

If we substitute raw answers directly into file templates, we ship variable quality. Users who write well get good files. Users who write poorly get poor files. This destroys the platform's value proposition.

## The solution

A synthesis layer mediates between captured answers and final file content. For fields where quality matters most, the platform sends the user's raw answer to Claude (via the Anthropic API) along with framework rules, example outputs, and the target structure. Claude produces file-ready content that preserves the user's intent while enforcing framework compliance.

This is not "writing for the user." It's enforcing the rules they already agreed to during the interview — pushing weak answers toward stronger forms, catching clichés the validation missed, ensuring consistent voice across sections.

---

# Field classification

Not every field needs synthesis. Direct substitution works for some; light formatting for others; full synthesis for the highest-leverage content.

## Direct substitution (no synthesis)

User input goes verbatim into the file. Used for:

- `brand_name`, `entity.name`
- Locale codes (en, pt, es)
- Channel names (INSTAGRAM, LINKEDIN, etc.)
- Segment IDs (SEG_001, SEG_002)
- Pillar IDs (PIL_001, PIL_002)
- Numeric values (context weights, segment modifiers)
- Booleans (allow/forbid, yes/no)
- Selected enum values (precise/considered/conversational/accountable)

## Light substitution (formatting only)

User input is reformatted but not reworded. Used for:

- Lists → rendered as bullets, numbered lists, or comma-separated
- Objects → rendered as YAML or labeled blocks
- Per-locale dictionaries → iterated and labeled

## Full synthesis (LLM-mediated)

User input is processed by Claude with framework rules. Used for:

| Interview field | Why synthesis |
|---|---|
| Q1.3 entity description | Push toward structural, regulatory-filing-style description |
| Q1.4 thesis problem and causes | Enforce mechanism-first; each cause must be a mechanism, not a state |
| Q1.5 thesis resolution | Verify it's a specific approach, not a vague aspiration |
| Q1.6 value chain effects | Ensure effects are observable/measurable, not abstract |
| Q1.7 positioning axes | Verify axes describe operational dimensions, not marketing |
| Q1.8 differentiators | Apply competitor test — reject items that could describe a competitor |
| Q1.9 negative definition | Verify each item is structural ("not a traditional developer") not opinion ("not boring") |
| Q1.10 outcomes | Verify outcomes are observable results, not experience claims |
| Q1.11 short definition per locale | Final polish — mechanism-first, blocklist-clean, native to locale |
| Q2.1 audience framing | Ensure it's mechanism-based, not demographic |
| Q2.3.4 segment core problem | Verify it's a structural friction, not a desire |
| Q2.5 non-targets reasons | Ensure reasons reference brand mechanisms, not just exclusion |
| Q3.2.1 pillar problem | Verify problem is specific to this pillar (not duplicated across pillars) |
| Q3.2.2 pillar mechanism | Verify it's an operational mechanism, not a value |
| Q3.2.3/4 decision rules | Verify accept_when/reject_when are testable conditions |
| Q3.2.5 pillar effect | Verify effect is observable/measurable |
| Q3.3 contradictions | Verify each tension is real (the two pillars genuinely pull opposite) |
| Q3.4 system principle | Single sentence; final polish |
| Q4.1 voice identity descriptors | Apply competitor test |
| Q4.4 brand-specific forbidden phrases | Verify each is brand-specific, not generic |
| Q4.6 register samples per locale | Light synthesis — verify each sample matches its register's rules |
| Q4.7 sensitive situation playbook | Verify each follows accountable structure principles |
| Q4.8 off-domain templates | Validate placeholder presence; light polish |
| Q5.1 signature phrases per locale | Verify each is brand-specific and recognizable |
| Q5.4 brand-specific blocklist | Verify entries with bad/good examples align with framework |
| Q7.2 example outputs | Final polish — each example should be exemplary, blocklist-clean |

The fields not listed get direct or light substitution.

---

# Synthesis architecture

## When synthesis runs

After interview submission, before file generation:

```
[Interview submitted]
       ↓
[Status: interview_complete]
       ↓
[Admin clicks "Synthesize answers" in admin panel]
       ↓
[Synthesis runs for each Full-synthesis field, in dependency order]
       ↓
[Synthesized content saved to interview_answers.synthesized]
       ↓
[Admin reviews synthesized content (can edit further)]
       ↓
[Admin clicks "Generate files"]
       ↓
[Files generated using synthesized content + direct substitutions]
```

## Storage

The synthesized output is stored separately from the raw answers, preserving both:

```sql
-- Already in schema:
interview_answers.answers jsonb            -- raw user input
interview_answers.admin_edits jsonb        -- admin overrides

-- Add to schema:
interview_answers.synthesized jsonb        -- LLM-synthesized content
interview_answers.synthesis_log jsonb      -- log of each synthesis run
```

This gives the admin three layers:
1. Raw answer — what the user typed
2. Synthesized — what Claude produced from the raw answer + framework rules
3. Admin-edited — Hugo's final tweaks

File generation uses (in order of precedence): admin_edits > synthesized > answers.

## Dependency order

Some synthesized fields reference others. Synthesis runs in dependency order:

1. Phase 1 entity (Q1.3) — sets the brand identity context
2. Phase 1 thesis (Q1.4, Q1.5) — references entity
3. Phase 1 value chain, positioning, differentiation, negative def, outcomes — reference thesis
4. Phase 1 short definitions — synthesizes from all above
5. Phase 2 audience framing — references thesis and short definition
6. Phase 2 per-segment fields — reference framing
7. Phase 3 per-pillar fields — reference thesis, segments
8. Phase 3 contradictions and system principle — reference pillars
9. Phase 4 voice identity and core rule — reference brand identity
10. Phase 4 register samples — reference voice identity
11. Phase 4 sensitive playbook and off-domain — reference samples
12. Phase 5 signature phrases and lexicon — reference voice
13. Phase 7 examples — reference everything (and are most quality-sensitive)

A dependency graph is maintained in code. Earlier synthesized content is fed into later synthesis prompts as context.

---

# The synthesis prompt structure

Every synthesis call to Claude uses a consistent prompt structure:

```
[SYSTEM PROMPT]
You are a synthesis agent for the nineyards brand DNA platform.
Your job: take a brand owner's raw interview answer and produce
file-ready content that complies with the nineyards framework.

The framework rules:
1. Mechanism-first: every claim must reference a specific operational
   mechanism, not a feeling, value, or aspiration.
2. No AI-default clichés: the universal blocklist (see below) is
   strictly forbidden, in any locale.
3. Structural over aspirational: describe what is, not what feels.
4. Native to the target locale: never translate; the user's intent
   must be preserved but the output must read natively in [locale].
5. Consistent with the rest of the brand DNA: see context below.

You preserve the user's intent. You do not invent claims they didn't
make. You do not soften critique. You enforce the framework's quality
bar on the form, not the substance.

[CONTEXT]
Brand: {{brand_name}}
Locale of this synthesis: {{locale}}
Framework version: {{framework_version}}

Already synthesized (use as voice/style reference):
{{prior_synthesized_content | summarized}}

Universal AI-default blocklist:
{{universal_blocklist}}

Locale-specific blocklist (if applicable):
{{locale_blocklist}}

[TASK]
Field being synthesized: {{field_id}} ({{field_description}})
Target output structure: {{target_structure}}
Framework rules specific to this field:
{{field_specific_rules}}

User's raw answer:
{{raw_answer}}

[OUTPUT FORMAT]
Produce the file-ready content for this field. Do not add commentary.
Do not explain your reasoning. Output the content only, in the exact
structure specified.

If the user's raw answer is so weak it cannot be synthesized into a
framework-compliant version, output:
SYNTHESIS_FAILURE: [brief reason]
The platform will surface this to the admin for manual review.
```

This is template — actual prompts substitute the placeholders with content for each specific synthesis call.

## Examples of synthesis prompts per field

### Q1.4 — Thesis problem and causes

```
Field: Q1.4 - Thesis problem and causes
Target structure:
  problem: single sentence stating the problem the brand solves
  causes: 3-5 bullet items, each a specific mechanism that produces
          the problem

Framework rules:
- Problem must be a structural condition, not a feeling
- Each cause must be a mechanism — something that HAPPENS, not a
  state of being
- Causes should be discrete (not overlapping)
- No AI-default verbs ("transform", "elevate", etc.)

User raw answer:
problem: "{{raw.problem}}"
causes:
  - "{{raw.causes[0]}}"
  - "{{raw.causes[1]}}"
  - ...

Examples of strong answers (from reference brands):
problem: "Housing cost is driven by production inefficiency."
causes:
  - Fragmented supply chain
  - Non-standardized design
  - Manual construction methods
  - Intermediary margin stacking

Examples of weak answers that need refinement:
problem: "Houses are too expensive."
→ Refine: state the structural reason houses are expensive.

problem: "Customers want better quality."
→ Refine: this is an aspiration, not a problem mechanism. Identify
   the structural cause of poor quality.

Synthesize the user's raw answer into the framework-compliant form.
```

### Q3.2.2 — Pillar mechanism

```
Field: Q3.2.{n}.mechanism (pillar {{PIL_NNN}})
Target structure: one sentence or short phrase describing the
specific operational mechanism

Framework rules:
- Must be an operational mechanism (something the brand DOES),
  not a value (something the brand IS) or a benefit (something
  the user GETS)
- Must reference a specific system component when possible
- Must not duplicate the mechanism of another pillar

User raw answer:
"{{raw.mechanism}}"

Already-synthesized context:
- Pillar problem: "{{synthesized.pillar.problem}}"
- Other pillars' mechanisms (do not duplicate):
  {{other_pillars.mechanisms}}

Examples of strong mechanisms:
- "LSF, modular, precast, 3D" (operational components)
- "Standardized T2/T3 typologies" (specific design system)
- "Bundling into mortgage" (specific financing mechanism)

Examples of weak mechanisms that need refinement:
- "We prioritize quality" (value, not mechanism)
- "Better customer experience" (benefit, not mechanism)
- "Innovation" (AI-default cliché, banned)

Synthesize.
```

### Q4.6 — Register samples

For register samples, synthesis is lighter — the user has written finished samples. Synthesis verifies:
- The sample matches the register's rules (precise/considered/conversational/accountable)
- No AI clichés
- Voice is consistent with `Q4.1 identity` and `Q4.2 traits`
- Sample is genuinely in the target locale (not auto-translated)

```
Field: Q4.6 register sample, register={{register_name}}, locale={{locale}}
Target: 60-200 words, in {{locale}}, demonstrating the {{register_name}}
register

Framework rules for {{register_name}}:
{{register_rules}}

User submitted sample:
"{{raw.sample}}"

Already-synthesized context:
- Voice identity: {{synthesized.q4_1.identity}}
- Voice traits: {{synthesized.q4_2.traits}}
- Core rule: {{synthesized.q4_3.core_rule}}

Verify the user's sample. If it complies with the framework, output
verbatim. If it has minor violations (cliché, off-voice), produce a
refined version. If it's substantively wrong (wrong register, wrong
language, etc.), output SYNTHESIS_FAILURE.
```

### Q7.2 — Example output

```
Field: Q7.2.{n} example output, locale={{locale}}
Mode: {{mode}}, channel: {{channel}}, segment: {{segment}},
register: {{register}}, situation: {{situation}}

Target: a finished, exemplary output for the specified resolution
tuple

Framework rules:
- Length appropriate to channel (from 30_CHANNEL_SPECS)
- Register matches (precise/considered/conversational/accountable)
- Invokes the specified pillars by mechanism
- Avoids universal and locale blocklists
- Native to {{locale}}

User submitted output:
"{{raw.output}}"

User submitted "why it works":
"{{raw.why_it_works}}"

Already-synthesized context:
- Brand short definition: "{{synthesized.short_definition[locale]}}"
- Pillars referenced: {{pillars.synthesized}}
- Voice samples for {{register}}: "{{synthesized.q4_6[locale][register]}}"

Verify the user's example. If exemplary, output verbatim. If minor
issues, refine. If substantively wrong, output SYNTHESIS_FAILURE.

The "why it works" annotations should reference specific framework
mechanisms (e.g., "invokes PIL_001 via the phrase X", "opens with
mechanism not aspiration"). Refine if the annotations are vague.
```

---

# Validation after synthesis

Every synthesized field is validated:

1. **Blocklist scan** — universal + locale-specific. Any hit = re-synthesize or flag for admin.
2. **Structural completeness** — required sub-fields present.
3. **Length compliance** — within field's max length.
4. **Self-consistency** — the field doesn't contradict already-synthesized fields.
5. **No placeholder leaks** — no `{{...}}` in the output.

If validation fails, the synthesis is retried up to 3 times with a refinement prompt. If it fails after 3 retries, the field is flagged in admin UI with a `SYNTHESIS_FAILURE` status — admin must manually write or accept the raw answer.

---

# Admin review workflow

After synthesis runs, the admin panel shows each field in three layers:

```
Field: Q1.4 thesis problem and causes

[Raw answer]              ← what the user typed
problem: "Houses are too expensive"
causes:
  - "Builders charge too much"
  - "Materials are pricey"

[Synthesized version]      ← Claude's refined output (editable)
problem: "Housing cost is driven by structural inefficiency in production."
causes:
  - Fragmented supply chain prevents bulk procurement
  - Non-standardized designs require custom architecture
  - Manual construction methods produce variable timelines
  - Intermediary margin stacking inflates final prices

[Admin notes]              ← Hugo's optional commentary
"User's raw answer was very weak — synthesis pulled toward Inhabitus
reference. Confirm this matches the actual brand's POV before finalizing."

[Status]
☐ Approve synthesized version
☐ Use raw version (override synthesis)
☐ Edit synthesized further
☐ Mark for follow-up with client
```

Hugo can:
- Approve the synthesized version (most common)
- Edit it further (small tweaks)
- Override with the raw version (if synthesis went too far)
- Flag for follow-up (if the gap between raw and target is too large for synthesis alone)

The "final" content used in file generation is whichever layer is marked active. Default: synthesized.

---

# When synthesis should NOT happen

Some fields are explicitly NOT synthesized:

1. **Decision rules (Q3.2.3 accept_when, Q3.2.4 reject_when)** — these are operational rules the brand owner must own. Synthesis would risk inventing rules the brand owner didn't intend.

2. **Context weights and segment modifiers (Q3.2.6, Q3.2.7)** — numeric values from sliders. No room for synthesis.

3. **Triggers per locale (Q2.3.1 triggers)** — language-specific keywords. Synthesis would risk replacing brand-owner's specific phrasings with generics.

4. **Punctuation policy (Q5.3)** — discrete choices, no synthesis applicable.

5. **Channel length overrides (Q6.1)** — numbers.

6. **Off-domain template substitutions** — the templates themselves get light synthesis (verifying placeholder presence, polishing language), but the substitution values ([BRAND_NAME], [TOPIC]) are direct.

For all of these, raw answers go straight into file generation.

---

# Synthesis cost and timing

## Cost

Each synthesis call to Claude API costs approximately:
- Average input tokens per field: 800-2000 (system prompt + context + raw answer)
- Average output tokens per field: 100-500
- At Claude Sonnet pricing (current rates): ~$0.005-0.020 per field

Total cost per brand DNA generation:
- ~30-50 synthesized fields per brand (varies with segment/pillar/locale counts)
- Estimated cost: $0.50-$2.00 per generation

This is negligible relative to client value. Budget should be set in the platform's Claude API key with monthly limits ($50-100/month sufficient for early volumes).

## Timing

Synthesis runs in parallel where dependencies allow. Estimated wall-clock time:
- Sequential: ~30-50 fields × ~3 seconds/field = 90-150 seconds
- Parallelized respecting dependencies: ~30-60 seconds total

This is fast enough to feel instant from the admin's perspective. The admin can review each synthesized field as it appears.

## Failure handling

If the Claude API is down or returns errors:
- Retry with exponential backoff (3 attempts)
- If still failing, mark synthesis as `failed` and fall back to raw answers
- Notify admin via dashboard banner
- Admin can re-trigger synthesis later

---

# Iteration: improving synthesis quality

As the platform sees more brands through the system, synthesis prompts should be refined:

1. **Tag synthesis outputs** with a quality score in admin UI (1-5 stars)
2. **Collect examples** of synthesis that needed heavy admin editing
3. **Identify patterns** — which fields are hardest? Which user-answer patterns produce weakest synthesis?
4. **Refine the prompts** — add more example shots to the synthesis prompts for problematic fields

A monthly review process improves prompt quality based on actual usage.

---

# Platform implementation checklist

To build the synthesis layer:

- [ ] Add `synthesized` and `synthesis_log` columns to `interview_answers` table
- [ ] Build the synthesis prompt template engine (substitutes context per field)
- [ ] Maintain a registry mapping each field ID to its synthesis prompt template
- [ ] Implement dependency graph for sequencing
- [ ] Implement parallel execution where dependencies allow
- [ ] Build admin UI for reviewing synthesized vs raw (three layers visible)
- [ ] Implement validation after synthesis (blocklist, structure, length, consistency)
- [ ] Implement retry logic for failed synthesis
- [ ] Track quality scores per synthesis output
- [ ] Maintain reference brand outputs (Inhabitus as primary reference) as exemplars in prompts
- [ ] Maintain locale-specific reference brand outputs as exemplars
- [ ] Set up Anthropic API integration with rate limiting and cost tracking

---

# Reference brand library

For synthesis to work, the platform needs reference brand outputs — examples of what GOOD looks like for each field. These are loaded into synthesis prompts as few-shot examples.

The reference library should include:

- **Primary reference: Inhabitus** — the brand the framework was built around. Full file pack available as ground truth.
- **Synthetic reference brands** — built by the nineyards team for additional reference. Cover different industries: B2B SaaS, fintech, consumer goods, professional services. Each brand has its own full file pack illustrating how the framework applies in that context.

These reference brands are stored in `/templates/references/` and are consulted by the synthesis engine but never delivered to clients. They exist purely as exemplars.

Recommendation: build 3-4 reference brands during the platform's pre-launch phase, before the first real client onboarding.

---

# Summary

The synthesis layer is what turns the platform from "structured intake form + template filler" into "brand DNA generation system." Without it, file generation has correct structure but variable content quality. With it, every generated file enforces the framework's quality bar regardless of the user's writing skill.

This is not optional for a production platform. It should be built before the first paying client uses the system.

For the beta phase, an interim approach is acceptable: Hugo manually reviews and refines each field in the admin panel before file generation. The synthesis layer can be built in parallel and rolled in once stable. But the platform's claim of consistent quality depends on this layer existing eventually.

---

End of synthesis layer specification.
