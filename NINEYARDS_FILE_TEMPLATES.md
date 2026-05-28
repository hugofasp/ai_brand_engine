# ai brand engine — File Generation Templates

> The 12 brand DNA file templates with placeholder syntax showing
> exactly how interview answers map to generated file content.
>
> Companion to NINEYARDS_BUILD_SPEC.md and NINEYARDS_INTERVIEW_FULL.md.

---

## How file generation works

```
generateFile(requestId, fileName) {
  1. Load template from /templates/files/[fileName].template
  2. Load interview_answers.answers from Supabase
  3. Apply admin_edits if present (admin overrides win on conflict)
  4. For each placeholder in template:
     a. Resolve via the answer-path mapping
     b. Apply formatting (list → bullets, object → YAML-ish, etc.)
     c. Substitute into template
  5. Run validation:
     - Universal blocklist scan
     - Required-section completeness check
     - Cross-reference integrity (all IDs resolve)
  6. Save to request-files/[requestId]/files/[fileName]
  7. Return file with any warnings flagged for admin review
}
```

## Placeholder syntax

Templates use double-curly placeholders with dot-notation paths:

```
{{phase_1.q1_3.name}}                  → single value
{{phase_1.q1_4.causes | bullets}}      → formatted as bullet list
{{phase_2.segments[].name | each}}     → iterate over array
{{phase_3.pillars[PIL_001].mechanism}} → indexed access
{{constants.framework_version}}        → platform-level constant
```

## Format filters

| Filter | Behavior |
|---|---|
| `bullets` | Renders list as `- item\n- item\n...` |
| `numbered` | Renders list as `1. item\n2. item\n...` |
| `each` | Iterates with template block |
| `yaml` | Renders object as YAML key-value |
| `quote` | Wraps in quotes |
| `paragraph` | Renders as flowing prose (line breaks become spaces) |
| `pipe_list` | Joins list with ` | ` |

---

# Template: `10_BRAND_CORE.txt.template`

```
# 10_BRAND_CORE

Document ID: BRAND_CORE
Version: {{constants.framework_version}}
Last updated: {{constants.generation_date}}

## Locale configuration
Primary locale: {{phase_1.q1_1.locale_primary}}
Secondary locales: {{phase_1.q1_1.locale_secondary | pipe_list}}

## Channel locale defaults
{{#if phase_1.q1_2}}
{{phase_1.q1_2 | each}}
- {{channel}}: {{value}}
{{/each}}
{{else}}
(none configured — locale follows prompt language by default)
{{/if}}

## Entity
Name: {{phase_1.q1_3.name}}
Type: {{phase_1.q1_3.type}}
Structure: {{phase_1.q1_3.structure}}
Focus: {{phase_1.q1_3.focus}}
Region: {{phase_1.q1_3.region}}
Specialization: {{phase_1.q1_3.specialization}}

## Thesis
Problem: {{phase_1.q1_4.problem}}
Causes:
{{phase_1.q1_4.causes | bullets}}
Resolution: {{phase_1.q1_5.resolution}}

## Value chain
Stages:
{{phase_1.q1_6.stages | bullets}}
Effect:
{{phase_1.q1_6.effects | bullets}}

## Positioning
Category: {{phase_1.q1_7.category}}
Axes:
{{phase_1.q1_7.axes | bullets}}

## Differentiation
{{phase_1.q1_8.differentiators | bullets}}

## Negative definition
{{phase_1.q1_9.negative_definition | bullets}}

## Outcomes
{{phase_1.q1_10.outcomes | bullets}}

## Short definitions
{{#each phase_1.q1_11.short_definitions}}
short_definition_{{locale}}: |
  {{value}}
{{/each}}
```

---

# Template: `11_AUDIENCE.txt.template`

```
# 11_AUDIENCE

Document ID: AUDIENCE
Version: {{constants.framework_version}}

## Audience framing
Basis: mechanism-based
Primary insight: {{phase_2.q2_1.primary_insight}}
Consequence: {{phase_2.q2_1.consequence}}

## Primary segment
{{phase_2.q2_2.segments[primary_segment_index].id}}
({{phase_2.q2_2.segments[primary_segment_index].name}})

{{#each phase_2.q2_3.segments}}
## Segment {{id}}
ID: {{id}}
Display name:
{{#each name_by_locale}}
  {{locale}}: {{value}}
{{/each}}

Triggers (locale-tagged keywords that signal this segment in a prompt):
{{#each triggers}}
  {{locale}}:
    {{values | bullets_indented}}
{{/each}}

Criteria:
- Structural conditions:
{{criteria.structural_conditions | bullets_indented}}
- Financial position: {{criteria.financial_position}}
- Stage of life: {{criteria.stage_of_life}}

Primary condition: {{primary_condition}}
Core problem: {{core_problem}}

Drivers:
{{drivers | bullets}}

Non-drivers:
{{non_drivers | bullets}}

System fit: {{system_fit}}
Why this segment matters: {{why_segment_matters}}

{{/each}}

## Common conditions across segments
{{phase_2.q2_4.common_conditions | bullets}}

## Non-targets
{{#each phase_2.q2_5.non_targets}}
- Description: {{description}}
  Reason for exclusion: {{reason_for_exclusion}}
{{/each}}

## Decision thresholds
- Access condition: {{phase_2.q2_6.access_condition}}
- Structure condition: {{phase_2.q2_6.structure_condition}}
- Confidence condition: {{phase_2.q2_6.confidence_condition}}

## Output priority order
1. Segment fit
2. Friction type
3. System mechanism
4. Economic effect
5. Outcome
```

---

# Template: `12_PILLARS.txt.template`

```
# 12_PILLARS

Document ID: PILLARS
Version: {{constants.framework_version}}

## How runtime uses this file
At resolution time, 00_SYSTEM_PROTOCOL Step 2:
1. Computes adjusted_weight = weight_by_context[context] + segment_modifier[segment]
2. Ranks pillars by adjusted_weight, descending
3. Filters out any pillar whose reject_when fires against the prompt
4. Selects the top 2 to 3 surviving pillars
5. During generation, consults contradictions and system_principle
   when tensions arise

{{#each phase_3.pillars}}
## Pillar {{id}}
ID: {{id}}
Display name:
{{#each display_name}}
  {{locale}}: {{value}}
{{/each}}

Problem: {{problem}}
Mechanism: {{mechanism}}

Decision rule — accept when:
{{decision_rule.accept_when | bullets}}

Decision rule — reject when:
{{decision_rule.reject_when | bullets}}

Effect: {{effect}}

Weight by context (0 to 5):
- SALES: {{weight_by_context.SALES}}
- INVESTOR: {{weight_by_context.INVESTOR}}
- TECHNICAL: {{weight_by_context.TECHNICAL}}
- COMMUNITY: {{weight_by_context.COMMUNITY}}
- INTERNAL: {{weight_by_context.INTERNAL}}

Segment modifiers (-2 to +2, added to base weight):
{{#each segment_modifiers}}
- {{segment_id}}: {{value}}
{{/each}}

{{/each}}

## How pillars operate per mode

### In CONTENT_MODE
Selected pillars are emphasis themes for the output. For generation
from scratch, content invokes pillars via mechanism. For improvement
of submitted material, pillars guide which mechanisms must appear
or which claims need to trace to mechanism.

### In ANALYTICAL_MODE
Selected pillars are named analytical lenses.

For open questions: engage 2-3 most relevant pillars by name in
the analysis.

For proposals: engage all pillars whose decision_rules apply to
the proposed action. Each reject_when condition that fires against
the proposal becomes a flagged conflict; each accept_when condition
satisfied becomes an alignment point. Contradictions become explicit
trade-off framings. system_principle resolves tensions not covered
by named contradictions.

## Contradictions
{{#each phase_3.q3_3.contradictions}}
### Tension: {{tension}}
Interpretation: {{interpretation}}
Resolution rule: {{resolution_rule}}

{{/each}}

## System principle
{{phase_3.q3_4.system_principle}}
```

---

# Template: `20_VOICE_CORE.txt.template`

```
# 20_VOICE_CORE

Document ID: VOICE_CORE
Version: {{constants.framework_version}}

This file is locale-agnostic. Voice identity, traits, the core
reasoning sequence, and the universal AI-default blocklist apply
across all locales. Locale-specific expression and lexicon live in
21_VOICE_FLEX_[LOCALE] and 22_LEXICON_[LOCALE].

## Identity
{{phase_4.q4_1.identity | bullets}}

## Traits
{{phase_4.q4_2.traits | bullets}}

## Core rule
{{phase_4.q4_3.core_rule}}

## Reasoning protocol
When making any claim, sequence:
1. Identify system element
2. Identify inefficiency or problem
3. Explain mechanism
4. Link to outcome
5. Validate against constraints

## Formatting constraints
- Em dashes: {{phase_4.q4_5.em_dashes}}
- Exclamation marks: {{phase_4.q4_5.exclamation_marks}}
- All-caps for emphasis: {{phase_4.q4_5.all_caps_emphasis}}
- Oxford comma: {{phase_4.q4_5.oxford_comma}}
- Heading case: {{phase_4.q4_5.heading_case}}
- Emoji policy: {{phase_4.q4_5.emoji_policy}}

## Brand-specific forbidden phrases
{{#if phase_4.q4_4.forbidden_phrases}}
{{phase_4.q4_4.forbidden_phrases | bullets}}
{{else}}
(none specified — universal blocklist below applies as the only constraint)
{{/if}}

## Rejection rules
Reject and rephrase during generation if:
- The sentence applies to any competitor
- A claim lacks a mechanism
- The framing is purely aspirational
- Any blocklist term (universal or active-locale) appears
- Facts about the brand are invented
- A placeholder token is about to be output literally

---

## Universal AI-default blocklist
These are AI-cliché defaults that originate in English-language
training data and bleed into every locale via LLM tendencies. Check
this list when generating in ANY locale, regardless of brand primary.

[The platform inserts the full universal blocklist here — same for
every client. Reference: /templates/constants/universal_blocklist.txt]

{{constants.universal_blocklist}}

## How blocklists compose at runtime
At generation time, the LLM checks simultaneously:
1. This file's universal AI-default blocklist (always)
2. 22_LEXICON_[active_locale]'s native-language AI defaults
3. 22_LEXICON_[active_locale]'s brand-specific banned terms

A term hitting any source triggers rephrasing mid-generation.
```

**Note:** the `{{constants.universal_blocklist}}` is a static file maintained by the platform — same content for every generated `20_VOICE_CORE.txt`. The platform team maintains this list and updates it as new AI clichés are observed in the wild.

---

# Template: `21_VOICE_FLEX_[LOCALE].txt.template`

Generated once per supported locale. The locale is the suffix.

```
# 21_VOICE_FLEX_{{locale | upper}}

Document ID: VOICE_FLEX
Locale: {{locale}}
Version: {{constants.framework_version}}

This file ships once per supported locale. Examples and samples in
this file are written in {{locale_name}} by a native speaker. Never
auto-translate this file — register nuance does not survive
translation.

## Registers — tone surface (rendered in {{locale_name}})

### Precise
Default for: INVESTOR_MEMO, TECHNICAL_DOC
- Dense, claim+mechanism per sentence
- Numbers in opening clause
- No metaphor, no rhythm tricks

Sample in {{locale_name}}:
{{phase_4.q4_6.register_samples[locale].precise}}

### Considered
Default for: LINKEDIN, longform WEB, PRESS_RELEASE
- Clear claims with one memorable line per paragraph
- Light rhythm allowed, no flourish

Sample in {{locale_name}}:
{{phase_4.q4_6.register_samples[locale].considered}}

### Conversational
Default for: INSTAGRAM, EMAIL, INTERNAL_MEMO
- Shorter sentences, contractions allowed
- Same mechanism logic, friendlier surface

Sample in {{locale_name}}:
{{phase_4.q4_6.register_samples[locale].conversational}}

### Accountable
Used when situation = SENSITIVE — applied as STRUCTURE while keeping
the channel's natural register surface.
- Direct, no euphemism
- No defensiveness, no blame-shifting

Sample in {{locale_name}}:
{{phase_4.q4_6.register_samples[locale].accountable}}

## Structures — sequence of moves

### Default structures by channel
See 30_CHANNEL_SPECS_{{locale | upper}}.

### Accountable structure (applied when situation = SENSITIVE)
Sequence: acknowledge → cause → action → timeline

Apply this structure regardless of register. Output keeps the
channel's natural register surface in {{locale_name}} but follows the
accountable sequence of moves.

## Sensitive situation playbook (in {{locale_name}})
- Delays: {{phase_4.q4_7.sensitive_playbook[locale].delays}}
- Complaints: {{phase_4.q4_7.sensitive_playbook[locale].complaints}}
- Price changes: {{phase_4.q4_7.sensitive_playbook[locale].price_changes}}
- Closures: {{phase_4.q4_7.sensitive_playbook[locale].closures}}
- Refunds: {{phase_4.q4_7.sensitive_playbook[locale].refunds}}

---

## Off-domain response templates (in {{locale_name}})

Used when 00_SYSTEM_PROTOCOL Step 0 determines the prompt is outside
brand scope AND the user's prompt is in {{locale_name}}. Pick the
template matching the register the user appears to be writing in.

### Precise register
{{phase_4.q4_8.off_domain_templates[locale].precise}}

### Considered register
{{phase_4.q4_8.off_domain_templates[locale].considered}}

### Conversational register
{{phase_4.q4_8.off_domain_templates[locale].conversational}}

### Accountable register
{{phase_4.q4_8.off_domain_templates[locale].accountable}}

Substitution rule (mandatory):
- [BRAND_NAME] → entity.name from 10_BRAND_CORE
- [SHORT_DEFINITION] → short_definition_{{locale}} from 10_BRAND_CORE
- [TOPIC] → the user's actual topic, briefly named in {{locale_name}}

Never output a placeholder token literally.

## Same message across registers (auto-generated)
[Auto-generated by the platform from the four register samples
above. The platform extracts the shortest sample and renders it
as a side-by-side worked example showing each register's
treatment of the same core message.]

{{auto_generated.register_comparison[locale]}}
```

**Note on the "Same message across registers":** the platform auto-generates this section by taking the user's four register samples and synthesizing a comparison view. Alternative: this can be a manual editorial pass — the admin sees the auto-generated version and refines it before finalizing the file. The framework template requires this section, so it must be present in the output even if minimal.

---

# Template: `22_LEXICON_[LOCALE].txt.template`

```
# 22_LEXICON_{{locale | upper}}

Document ID: LEXICON
Locale: {{locale}}
Version: {{constants.framework_version}}

This file ships once per supported locale. Holds locale-native
content only. The universal AI-default blocklist lives in
20_VOICE_CORE and applies across all locales.

## How to use
While generating in {{locale_name}}, check this file PLUS the
universal blocklist in 20_VOICE_CORE. Both apply simultaneously.

## Signature phrases (brand-owned, in {{locale_name}})
Phrases unique to this brand. Reuse them — they are recognizable.
{{phase_5.q5_1.signature_phrases[locale] | bullets}}

## Preferred substitutions (in {{locale_name}})
{{#each phase_5.q5_2.preferred_substitutions[locale]}}
- "{{use}}" not "{{instead_of}}"
{{/each}}

## Punctuation and formatting (locale-specific)
- Quotation marks: {{phase_5.q5_3.punctuation_policy[locale].quotation_marks}}
{{#if phase_5.q5_3.punctuation_policy[locale].other_notes}}
- Other: {{phase_5.q5_3.punctuation_policy[locale].other_notes}}
{{/if}}

(Em dashes, Oxford comma, heading case, emoji, hashtags inherited
from 20_VOICE_CORE formatting constraints.)

---

## Native AI-default blocklist (in {{locale_name}})
AI-cliché defaults specific to {{locale_name}}. NOT direct
translations of the universal English list in 20_VOICE_CORE —
those are checked separately. This section captures clichés that
originate in {{locale_name}}-language marketing defaults.

{{#each phase_5.q5_5.native_blocklist[locale] | filter:accepted}}
### "{{term}}"
Bad: {{bad_example}}
Why it fails: {{why_it_fails}}
Better: {{better_version}}

{{/each}}

---

## Brand-specific blocklist (in {{locale_name}})
{{#if phase_5.q5_4.brand_specific_blocklist[locale]}}
{{#each phase_5.q5_4.brand_specific_blocklist[locale]}}
### "{{term}}"
Bad: {{bad_example}}
Why it fails: {{why_it_fails}}
Better: {{better_version}}

{{/each}}
{{else}}
(No brand-specific banned terms in {{locale_name}}.)
{{/if}}
```

---

# Template: `30_CHANNEL_SPECS_[LOCALE].txt.template`

```
# 30_CHANNEL_SPECS_{{locale | upper}}

Document ID: CHANNEL_SPECS
Locale: {{locale}}
Version: {{constants.framework_version}}

## How to use
These are FALLBACK defaults. They apply only when no matching anchor
example exists in 31_EXAMPLES_LIBRARY_{{locale | upper}} for the
resolved tuple. If an anchor example is found, its structure and
length override these.

## Locale length note
Length specifications in this file are calibrated for {{locale_name}}.
{{constants.locale_length_notes[locale]}}

{{#each constants.channels}}
## {{channel_name}}
- Length: {{merge: defaults[locale][channel], phase_6.q6_1.channel_length_overrides[locale][channel]}}
- Default structure: {{defaults[locale][channel].structure}}
- Hashtags: {{phase_6.q6_3.hashtag_policy[channel] | render}}
- Emoji: {{phase_6.q6_4.emoji_policy[channel] | render}}
- CTA: {{merge: defaults.cta, phase_6.q6_5.cta_policy | render}}
{{/each}}

## Forbidden openers (locale-specific)
{{#if phase_6.q6_2.forbidden_openers[locale]}}
{{phase_6.q6_2.forbidden_openers[locale] | bullets_quoted}}
{{else}}
(No locale-specific forbidden openers configured. Universal
forbidden openers from 20_VOICE_CORE still apply.)
{{/if}}

## Cross-channel rules
Universal (from platform defaults):
- Never open with a rhetorical question
- Never use "in this post we'll explore" or similar throat-clearing
- Links: inline with descriptive anchor text (never "click here")
- Numbers: always specific, never rounded unless explicitly estimate
- CTAs: never empty ("learn more", "get in touch today")

Brand-specific (from phase_6.q6_6):
{{phase_6.q6_6.cross_channel_rules | bullets}}
```

**Note:** Platform-defined channel defaults live in `/templates/constants/channel_defaults.json`. The user's overrides merge over the defaults. Channel length defaults per locale are calibrated for typical text expansion (PT ~+20%, ES ~+15%, FR ~+25% vs EN).

---

# Template: `31_EXAMPLES_LIBRARY_[LOCALE].txt.template`

```
# 31_EXAMPLES_LIBRARY_{{locale | upper}}

Document ID: EXAMPLES_LIBRARY
Locale: {{locale}}
Version: {{constants.framework_version}}

## Status warning (read on load)
{{#if phase_7.example_count[locale] < 10}}
WARNING: This file contains {{phase_7.example_count[locale]}}
examples. The framework recommends a minimum of 10 per locale to
avoid generic outputs. Outputs in {{locale_name}} will rely on
30_CHANNEL_SPECS_{{locale | upper}} defaults for shape until more
examples are added.
{{/if}}

## How to use
Find the closest match using the fallback ladder in
00_SYSTEM_PROTOCOL. Mirror structure, density, length, and rhythm.
Never copy. Never paraphrase. Use as a shape anchor only.

All output text in this file is in {{locale_name}}. Written by a
native speaker, not auto-translated from another locale's library.

## Annotation schema
Every example uses these fields:
- ID:
- Mode: CONTENT or ANALYTICAL
- Starting material: yes / no (CONTENT only)
- Sub-shape: open / proposal (ANALYTICAL only)
- Proposal variant: aligned / contradictory / mixed (PROPOSAL only)
- Channel: (CONTENT only)
- Segment:
- Register:
- Situation:
- Pillars invoked:
- Prompt that triggered:
- Output:
- Why it works:
- Common traps avoided:

---

## CONTENT_MODE — Generation from scratch (starting_material: no)

{{#each phase_7.examples | filter: locale, mode='content_generation'}}
### {{id}}
- ID: {{id}}
- Mode: CONTENT
- Starting material: no
- Channel: {{channel}}
- Segment: {{segment}}
- Register: {{register}}
- Situation: {{situation}}
- Pillars invoked: {{pillars_invoked | comma_list}}
- Prompt that triggered: {{prompt}}
- Output:
{{output | indented}}
- Why it works:
{{why_it_works | bullets_indented}}
- Common traps avoided:
{{common_traps_avoided | bullets_indented}}

{{/each}}

---

## CONTENT_MODE — Improvement of submitted material (starting_material: yes)

{{#each phase_7.examples | filter: locale, mode='content_improvement'}}
### {{id}}
- ID: {{id}}
- Mode: CONTENT
- Starting material: yes
- Channel: {{channel}}
- Segment: {{segment}}
- Register: {{register}}
- Situation: {{situation}}
- Pillars invoked: {{pillars_invoked | comma_list}}
- Prompt that triggered (includes the embedded draft):
{{prompt | indented}}
- Output (the improved version):
{{output | indented}}
- Why it works:
{{why_it_works | bullets_indented}}
- Common traps avoided:
{{common_traps_avoided | bullets_indented}}

{{/each}}

---

## ANALYTICAL_MODE — Open questions (sub_shape: open)

{{#each phase_7.examples | filter: locale, mode='analytical_open'}}
### {{id}}
- ID: {{id}}
- Mode: ANALYTICAL
- Sub-shape: open
- Context: {{context}}
- Segment: {{segment}}
- Register: analytical
- Pillars engaged: {{pillars_invoked | comma_list}}
- Prompt that triggered: {{prompt}}
- Output:
{{output | indented}}
- Why it works:
{{why_it_works | bullets_indented}}

{{/each}}

---

## ANALYTICAL_MODE — Proposal evaluations (sub_shape: proposal)

{{#each phase_7.examples | filter: locale, mode='analytical_proposal'}}
### {{id}}
- ID: {{id}}
- Mode: ANALYTICAL
- Sub-shape: proposal
- Proposal variant: {{proposal_variant}}
- Context: {{context}}
- Pillars engaged: {{pillars_invoked | comma_list}}
- Prompt (the proposal being evaluated):
{{prompt | indented}}
- Output (the structured evaluation):
{{output | indented}}
- Why it works:
{{why_it_works | bullets_indented}}

{{/each}}
```

---

# Templates: framework-provided (universal across all clients)

These templates don't take any interview input. They're static files maintained by the platform and copied verbatim into each client's file pack:

- `00_SYSTEM_PROTOCOL.txt` — universal runtime contract
- `01_CONTEXT_INFERENCE.txt` — universal resolution rules
- `92_TEST_PROMPTS.txt` — universal regression suite

These are stored at `/templates/files/static/` and copied per request with no substitution.

The full content of these three files is the v1.4.1 framework as documented in our prior conversations. The platform should:
1. Maintain a single source of truth for each (likely the canonical version we polished through the framework iterations)
2. Update them when framework version bumps
3. Track which framework version each generated request was built against (`generated_files.framework_version`)

---

# Template: `90_INDEX.txt.template` (partial generation)

```
# 90_INDEX

Document ID: INDEX
Version: {{constants.framework_version}}
Purpose: Version manifest, ID definitions, supported locales,
maintenance checklist, and changelog.

## System version
Current: {{constants.framework_version}}
Released: {{constants.framework_release_date}}
Generated for: {{phase_1.q1_3.name}}
Generated at: {{constants.generation_date}}

## Supported locales
Primary: {{phase_1.q1_1.locale_primary}}
Secondary: {{phase_1.q1_1.locale_secondary | pipe_list}}

## File inventory and versions

### Locale-agnostic files
- 00_SYSTEM_PROTOCOL: {{constants.framework_version}}
- 01_CONTEXT_INFERENCE: {{constants.framework_version}}
- 10_BRAND_CORE: 1.0
- 11_AUDIENCE: 1.0
- 12_PILLARS: 1.0
- 20_VOICE_CORE: 1.0
- 90_INDEX: this file
- 92_TEST_PROMPTS: {{constants.framework_version}}

### Locale-specific files (one set per supported locale)
{{#each all_locales}}
- 21_VOICE_FLEX_{{locale | upper}}: 1.0
- 22_LEXICON_{{locale | upper}}: 1.0
- 30_CHANNEL_SPECS_{{locale | upper}}: 1.0
- 31_EXAMPLES_LIBRARY_{{locale | upper}}: 1.0
{{/each}}

Total files: 8 (agnostic) + 4 × ({{all_locales.length}} locales) = {{computed.total_file_count}}

---

## ID definitions

### Entity
BRAND_CORE: {{phase_1.q1_3.name}} — {{phase_1.q1_3.type}}

### Segments
{{#each phase_2.q2_3.segments}}
{{id}}: {{name}} | {{primary_condition | truncate:80}}
{{/each}}

### Pillars
{{#each phase_3.pillars}}
{{id}}: {{display_name | primary_locale}} | {{problem | truncate:80}}
{{/each}}

### Contexts
SALES: selling and acquisition
INVESTOR: capital and board comms
TECHNICAL: methodology and specifications
COMMUNITY: public-facing community building
INTERNAL: team and staff communication

### Channels
INSTAGRAM, LINKEDIN, EMAIL, INVESTOR_MEMO, TECHNICAL_DOC, WEB_HERO,
PRESS_RELEASE, INTERNAL_MEMO

### Registers
precise, considered, conversational, accountable

### Situations
NORMAL, SENSITIVE

### Structures
default_by_channel (see 30_CHANNEL_SPECS_[LOCALE])
accountable (acknowledge → cause → action → timeline)

---

## Maintenance checklist

[The maintenance checklist is universal across all clients —
inserted from /templates/constants/maintenance_checklist.txt]

{{constants.maintenance_checklist}}

---

## Changelog

### v{{constants.framework_version}} — Initial generation
- Generated by ai brand engine
- Framework version: {{constants.framework_version}}
- Brand: {{phase_1.q1_3.name}}
- Locales: {{phase_1.q1_1.locale_primary}}{{#if phase_1.q1_1.locale_secondary}}, {{phase_1.q1_1.locale_secondary | pipe_list}}{{/if}}

### Change conventions
On any update:
1. Follow the maintenance checklist above
2. Bump the affected file's version
3. Update file_versions list above
4. Add changelog entry
5. For breaking changes, bump system version major
6. Run 92_TEST_PROMPTS before publishing
```

---

# Generation order and dependencies

Generate files in this order (dependencies flow left to right):

```
10_BRAND_CORE  →  90_INDEX (uses entity.name, locale)
11_AUDIENCE    →  90_INDEX (uses segment IDs and names)
12_PILLARS     →  90_INDEX (uses pillar IDs and names)
20_VOICE_CORE  →  (no downstream deps)

Per locale:
21_VOICE_FLEX_[LOCALE]      →  (no downstream deps)
22_LEXICON_[LOCALE]         →  (no downstream deps)
30_CHANNEL_SPECS_[LOCALE]   →  (no downstream deps)
31_EXAMPLES_LIBRARY_[LOCALE] → (uses segment IDs, pillar IDs)
```

The framework-provided files (00, 01, 92) are copied at the start as boilerplate.

---

# Validation passes

After all files are generated, run validation:

1. **Cross-reference integrity** — every `SEG_NNN`, `PIL_NNN` reference resolves to a defined entity
2. **Locale completeness** — every supported locale has all four locale-specific files
3. **Blocklist scan** — every generated file scanned against the universal blocklist; warnings flagged for admin review
4. **Required-section completeness** — every template's required sections have non-empty content
5. **Placeholder leak check** — no `{{...}}` patterns remain in any generated file
6. **Pillar count** — at least 2 pillars defined
7. **Segment count** — at least 1 segment defined
8. **Example sparseness warning** — any locale with <10 examples flagged

Validation results displayed in admin UI; admin can override warnings or send file back to user for revision.

---

# Bundle creation

After all files are generated and finalized, create a zip bundle:

```
[brand-slug]-dna-pack-v{{framework_version}}.zip
├── 00_SYSTEM_PROTOCOL.txt
├── 01_CONTEXT_INFERENCE.txt
├── 10_BRAND_CORE.txt
├── 11_AUDIENCE.txt
├── 12_PILLARS.txt
├── 20_VOICE_CORE.txt
├── 21_VOICE_FLEX_EN.txt
├── 21_VOICE_FLEX_PT.txt          (one per supported locale)
├── 22_LEXICON_EN.txt
├── 22_LEXICON_PT.txt
├── 30_CHANNEL_SPECS_EN.txt
├── 30_CHANNEL_SPECS_PT.txt
├── 31_EXAMPLES_LIBRARY_EN.txt
├── 31_EXAMPLES_LIBRARY_PT.txt
├── 90_INDEX.txt
├── 92_TEST_PROMPTS.txt
└── README.txt                     (auto-generated package summary)
```

The README.txt explains what's in the bundle:
```
# {{brand_name}} — Brand DNA File Pack
# Generated by nineyards
# Framework version: {{framework_version}}
# Generated at: {{generation_date}}

## What's in this bundle

[brief description of each file]

## How to use this

See the Implementation Manual PDF (separate attachment) and the
How-to-Use Quickstart PDF (separate attachment) for setup
instructions on Claude Projects and ChatGPT Custom GPTs.

## Custom instructions

Two text blocks accompany this bundle (delivered in the email body):
1. Universal Custom Instructions — paste into Claude Projects'
   Custom Instructions field, or ChatGPT Custom GPT Instructions
2. ChatGPT Addendum — append after the universal block when
   deploying to ChatGPT

## Versioning

This bundle is paired with Custom Instructions v{{framework_version}}.
If you receive a system update, you'll get a new bundle with matching
custom instructions.

## Support

Questions? Reply to the delivery email or contact info@nineyards.pt.
```

---

End of file templates specification.
