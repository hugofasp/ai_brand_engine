# ai brand engine — Field-by-Field Synthesis Map

> The explicit mapping that closes the loop between interview capture
> and file generation. For every interview field, this document
> specifies: tags, synthesis behavior, the exact synthesis prompt
> structure, validation rules, and which template placeholder it
> fills.
>
> Without this mapping, the synthesis layer is theory. With it,
> the platform can be built to produce consistent quality output
> for any brand.
>
> Companion to NINEYARDS_INTERVIEW_FULL.md,
> NINEYARDS_FILE_TEMPLATES.md, and NINEYARDS_SYNTHESIS_LAYER.md.

---

## How to read this document

For each interview field, you'll find:

```
FIELD: Q[X.Y.Z] - Field name
TAGS: [tag1] [tag2] ...
SYNTHESIS: direct | light | full | none
TEMPLATE PLACEHOLDER: where the result lands in file generation
SYNTHESIS PROMPT: the exact prompt sent to Claude API (when applicable)
VALIDATION: what rules apply to the output
EXAMPLE: raw user answer → synthesized output → final file content
```

## Synthesis behavior types

- **direct** — User input copied verbatim into template. No LLM involvement.
- **light** — Formatting only (list to bullets, object to YAML). No content change.
- **full** — LLM-mediated synthesis. User input + framework rules → file-ready content.
- **none** — Field not used in file generation (e.g., contact info, internal metadata).

## Universal tag behaviors

These tags trigger specific synthesis behavior wherever they appear:

| Tag | Behavior |
|---|---|
| `[mandatory]` | File generation fails if empty. Admin must complete before delivery. |
| `[optional]` | Skipped if empty; template uses default or omits section. |
| `[mechanism_test]` | Synthesis verifies answer is mechanism-based, not aspirational. Re-synthesizes if state-of-being is detected instead of action. |
| `[competitor_test]` | Synthesis checks: "could a generic competitor say this?" Rejects/refines if yes. |
| `[boundary_check]` | Synthesis verifies the answer establishes a clear boundary (negative space, exclusion). |
| `[per_locale]` | Field has one value per supported locale. Each locale's value synthesized natively (never translated). |
| `[no_translation]` | If multi-locale, never produce locale variants by translation. Each locale captured independently from user. |
| `[brand_specific]` | Synthesis preserves brand-specific phrasing rather than generalizing. |
| `[brand_owned]` | Output should be recognizable as unique to this brand. |
| `[critical]` | Highest-priority validation. Synthesis quality gate is stricter. |
| `[meta_rule]` | Field is a system meta-rule (overrides others when applied). Synthesis ensures clarity and uniqueness. |
| `[locale_config]` | Field is a configuration value (ISO code, channel mapping). Direct substitution. |
| `[trade_off_framing]` | Field captures tension between elements. Synthesis verifies both sides are present and balanced. |

---

# Phase 1 — Foundation

## Q1.1 — Brand name and locale

```
FIELD: Q1.1
TAGS: [foundation] [locale_config] [mandatory]
SYNTHESIS: direct (brand_name), direct (locale codes)
TEMPLATE PLACEHOLDERS:
  - {{phase_1.q1_1.brand_name}} → 10_BRAND_CORE entity.name
  - {{phase_1.q1_1.locale_primary}} → 10_BRAND_CORE locale_primary
  - {{phase_1.q1_1.locale_secondary}} → 10_BRAND_CORE locale_secondary
VALIDATION:
  - brand_name: non-empty, ≤120 chars
  - locale codes: valid ISO 639-1
  - At least one locale (primary required)
EXAMPLE:
  raw: { brand_name: "Inhabitus", locale_primary: "pt", locale_secondary: ["en"] }
  synthesized: (no synthesis — direct)
  file_output: "Primary locale: pt\nSecondary locales: en"
```

## Q1.2 — Channel-locale defaults

```
FIELD: Q1.2
TAGS: [foundation] [locale_config] [optional]
SYNTHESIS: light (object to YAML)
TEMPLATE PLACEHOLDER: {{phase_1.q1_2}} → 10_BRAND_CORE channel_locale_defaults
VALIDATION: each channel value is either "follows_prompt" or a supported locale code
EXAMPLE:
  raw: { INSTAGRAM: "pt", LINKEDIN: "en", EMAIL: "follows_prompt" }
  synthesized: (light format)
  file_output: |
    INSTAGRAM: pt
    LINKEDIN: en
    EMAIL: follows prompt
```

## Q1.3 — Entity definition

```
FIELD: Q1.3
TAGS: [foundation] [entity] [mandatory] [mechanism_test]
SYNTHESIS: full
TEMPLATE PLACEHOLDERS:
  - {{phase_1.q1_3.name}} → 10_BRAND_CORE entity.name
  - {{phase_1.q1_3.type}} → 10_BRAND_CORE entity.type
  - {{phase_1.q1_3.structure}} → 10_BRAND_CORE entity.structure
  - {{phase_1.q1_3.focus}} → 10_BRAND_CORE entity.focus
  - {{phase_1.q1_3.region}} → 10_BRAND_CORE entity.region
  - {{phase_1.q1_3.specialization}} → 10_BRAND_CORE entity.specialization
VALIDATION:
  - All six fields present
  - No universal blocklist hits
  - No "leader in", "specializes in delivering", "innovative", "cutting-edge"
SYNTHESIS PROMPT:

  You are synthesizing the brand's entity definition. The user has
  provided six fields: name, type, structure, focus, region,
  specialization. Your job: ensure each field is a structural,
  operational description — the kind that could appear in a
  regulatory filing or wikipedia infobox.

  Framework rules for this field:
  - No marketing language ("leader", "innovative", "best-in-class")
  - Each field should be a concrete categorical description
  - Type names a category (e.g., "Housing Production Platform")
  - Structure names organizational form (e.g., "Vertically Integrated Developer")
  - Focus names what it operates on (e.g., "Residential Communities")
  - Region names primary market(s)
  - Specialization names the specific approach/methodology

  Reference examples of strong entity definitions:
  - name: "Inhabitus"
    type: "Housing Production Platform"
    structure: "Vertically Integrated Developer"
    focus: "Residential Communities"
    region: "Portugal"
    specialization: "Modern Methods of Construction (MMC)"

  User raw answer:
  {{raw_answer}}

  If any field is aspirational, marketing-flavored, or vague,
  refine it. Preserve the user's intent and brand specifics.

  Output JSON: { name, type, structure, focus, region, specialization }
  If a field cannot be salvaged, output SYNTHESIS_FAILURE with reason.

EXAMPLE:
  raw: {
    name: "Inhabitus",
    type: "A leading innovative real estate brand",
    structure: "We're vertically integrated",
    ...
  }
  synthesized: {
    name: "Inhabitus",
    type: "Housing Production Platform",
    structure: "Vertically Integrated Developer",
    ...
  }
  file_output: |
    Name: Inhabitus
    Type: Housing Production Platform
    Structure: Vertically Integrated Developer
    ...
```

## Q1.4 — Thesis: problem and causes

```
FIELD: Q1.4
TAGS: [foundation] [thesis] [mandatory] [mechanism_test]
SYNTHESIS: full
TEMPLATE PLACEHOLDERS:
  - {{phase_1.q1_4.problem}} → 10_BRAND_CORE thesis.problem
  - {{phase_1.q1_4.causes}} → 10_BRAND_CORE thesis.causes (rendered as bullets)
VALIDATION:
  - problem: single sentence, mechanism-based not feeling-based
  - causes: 3-5 items, each is an action/process (not a state)
  - No blocklist hits
SYNTHESIS PROMPT:

  You are synthesizing the brand's thesis — the central argument
  that drives the entire brand DNA. The user has provided a
  problem statement and 3-5 causes.

  Framework rules:
  - Problem is a structural condition, NOT a feeling
    Wrong: "Houses are too expensive" (this is a state)
    Right: "Housing cost is driven by production inefficiency"
           (this references a structural mechanism)
  - Each cause is a mechanism — something that HAPPENS
    Wrong: "Markets are inefficient" (state)
    Right: "Fragmented supply chain prevents bulk procurement" (mechanism)
  - Each cause should be discrete, not overlapping
  - No AI-default verbs ("transform", "elevate", "innovative")

  Reference examples of strong thesis answers:
  Brand: Inhabitus
  problem: "Housing cost is driven by production inefficiency."
  causes:
    - Fragmented supply chain
    - Non-standardized design
    - Manual construction methods
    - Intermediary margin stacking

  Brand: [B2B SaaS reference]
  problem: "Enterprise software adoption fails because deployment
            requires customization that exceeds vendor capacity."
  causes:
    - Configuration complexity inflates implementation time
    - Industry-specific workflows lack vendor templates
    - Cross-system integrations require bespoke work
    - Change management is treated as customer's problem

  User raw answer:
  {{raw_answer}}

  Already synthesized context (use for voice consistency):
  - Entity type: {{synthesized.q1_3.type}}
  - Entity specialization: {{synthesized.q1_3.specialization}}

  Synthesize. Output JSON: { problem, causes }

EXAMPLE:
  raw: {
    problem: "Houses are too expensive in Portugal",
    causes: [
      "Builders charge too much",
      "Materials are pricey",
      "Government is slow"
    ]
  }
  synthesized: {
    problem: "Housing cost is driven by production inefficiency.",
    causes: [
      "Fragmented supply chain inflates input costs",
      "Non-standardized design extends every project's design phase",
      "Manual construction methods produce timeline variability",
      "Slow licensing compounds carrying costs"
    ]
  }
  file_output: |
    Problem: Housing cost is driven by production inefficiency.
    Causes:
    - Fragmented supply chain inflates input costs
    - Non-standardized design extends every project's design phase
    - Manual construction methods produce timeline variability
    - Slow licensing compounds carrying costs
```

## Q1.5 — Thesis: resolution

```
FIELD: Q1.5
TAGS: [foundation] [thesis] [mandatory] [mechanism_test]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_1.q1_5.resolution}} → 10_BRAND_CORE thesis.resolution
VALIDATION: short phrase or sentence; specific approach, not vague aspiration
SYNTHESIS PROMPT:

  You are synthesizing the brand's resolution — how the brand
  resolves the thesis problem. The user provided a single sentence
  or short phrase.

  Framework rules:
  - Must be a specific approach, not "we make it better"
  - Should reference the mechanisms named in causes (Q1.4)
  - Short formulas work well ("Industrialize + Integrate + Standardize")

  Reference examples:
  - Inhabitus: "Industrialize + Integrate + Standardize"
  - [B2B SaaS reference]: "Pre-configured industry templates + native integrations + customer-owned deployment"

  User raw answer: {{raw_answer}}

  Already synthesized:
  - Problem: {{synthesized.q1_4.problem}}
  - Causes: {{synthesized.q1_4.causes}}

  Synthesize. Output: single string.

EXAMPLE:
  raw: "We make housing better by being efficient"
  synthesized: "Industrialize + Integrate + Standardize"
  file_output: "Resolution: Industrialize + Integrate + Standardize"
```

## Q1.6 — Value chain

```
FIELD: Q1.6
TAGS: [foundation] [value_chain] [mandatory]
SYNTHESIS: full
TEMPLATE PLACEHOLDERS:
  - {{phase_1.q1_6.stages}} → 10_BRAND_CORE value_chain.stages (bulleted, ordered)
  - {{phase_1.q1_6.effects}} → 10_BRAND_CORE value_chain.effects (bulleted)
VALIDATION:
  - stages: 3-8 items, ordered, each a concrete step
  - effects: 2-5 items, each observable/measurable
SYNTHESIS PROMPT:

  You are synthesizing the brand's value chain. The user provided
  ordered stages and cumulative effects.

  Framework rules:
  - Each stage is something concrete that happens (a process step)
  - Each effect is observable or measurable
  - Order matters for stages (earliest input → final delivery)

  Reference example:
  Inhabitus stages:
    - Land Acquisition (Direct)
    - Architecture (Standardized systems)
    - Construction (MMC)
    - Development
    - Sales (Direct-to-consumer)
    - Management (Condominium)
  Inhabitus effects:
    - Reduced margins
    - Increased control
    - Higher predictability

  User raw answer: {{raw_answer}}

  Synthesize. Preserve user's specific stages. Refine wording for
  concreteness. Output JSON: { stages, effects }

EXAMPLE:
  raw: {
    stages: ["We buy land", "We design houses", "We build them", "We sell to customers"],
    effects: ["More efficient", "Better quality", "Lower prices"]
  }
  synthesized: {
    stages: [
      "Land Acquisition (Direct)",
      "Architecture (Standardized systems)",
      "Construction (in-house)",
      "Sales (Direct-to-consumer)"
    ],
    effects: [
      "Reduced margin stacking",
      "Increased timeline predictability",
      "Lower blended cost"
    ]
  }
```

## Q1.7 — Positioning

```
FIELD: Q1.7
TAGS: [foundation] [positioning] [mandatory]
SYNTHESIS: full
TEMPLATE PLACEHOLDERS:
  - {{phase_1.q1_7.category}} → 10_BRAND_CORE positioning.category
  - {{phase_1.q1_7.axes}} → 10_BRAND_CORE positioning.axes (bulleted)
VALIDATION: category is a broad space; axes are operational dimensions not marketing claims
SYNTHESIS PROMPT:

  Reference examples:
  - Inhabitus category: "Housing Production Platform"
  - Inhabitus axes: ["Real estate development", "Construction innovation", "Community operations"]

  Reject axes that read as marketing claims ("premium", "innovative",
  "customer-focused"). Refine to operational dimensions.

  User raw answer: {{raw_answer}}

  Synthesize. Output JSON: { category, axes }

EXAMPLE:
  raw: { category: "Real estate", axes: ["Quality", "Affordability", "Innovation"] }
  synthesized: {
    category: "Housing Production Platform",
    axes: ["Real estate development", "Construction methodology", "Community operations"]
  }
```

## Q1.8 — Differentiation

```
FIELD: Q1.8
TAGS: [foundation] [differentiation] [mandatory] [competitor_test]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_1.q1_8.differentiators}} → 10_BRAND_CORE differentiation (bulleted)
VALIDATION:
  - 3-5 items
  - Each fails the competitor test ("could a competitor say this?")
SYNTHESIS PROMPT:

  Each differentiator must be structurally true for this brand and
  structurally untrue for competitors. Run the competitor test on
  each: could a generic competitor in the same category make this
  claim about themselves? If yes, reject and refine toward structural
  specificity.

  Reference example (Inhabitus):
    - Full value chain control
    - Industrialized construction
    - Standardized systems
    - Integrated community
    - Direct-to-consumer model

  User raw answer: {{raw_answer}}

  Synthesize each. Drop any that fail the competitor test if they
  cannot be refined. Output JSON: { differentiators: [...] }

EXAMPLE:
  raw: { differentiators: ["We care about customers", "Quality construction", "Innovative approach"] }
  synthesized: { differentiators: [
    "Full value chain control",
    "Industrialized construction methodology",
    "Direct-to-consumer model"
  ]}
  (Note: "We care about customers" and "Quality construction" failed
   competitor test — any competitor would claim these. Refined to
   structurally specific claims; dropped one rather than invent a
   third.)
```

## Q1.9 — Negative definition

```
FIELD: Q1.9
TAGS: [foundation] [negative_definition] [mandatory] [boundary_check]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_1.q1_9.negative_definition}} → 10_BRAND_CORE negative_definition (bulleted, "not a X" format)
VALIDATION: 3-5 items in "not a/an X" format; each item is a structural exclusion
SYNTHESIS PROMPT:

  Each entry should be a structural exclusion — a category or
  identity the brand explicitly is NOT, that it might be mistaken
  for. Should not be opinion ("not boring") but structural ("not a
  traditional developer").

  Reference example (Inhabitus):
    - not a traditional developer
    - not an architecture-only firm
    - not a contractor-only entity

  User raw answer: {{raw_answer}}

  Synthesize. Output JSON: { negative_definition: [...] }

EXAMPLE:
  raw: { negative_definition: ["Not boring", "Not corporate", "Not expensive"] }
  synthesized: { negative_definition: [
    "not a traditional real estate developer",
    "not an architecture-only firm",
    "not a construction-only contractor"
  ]}
```

## Q1.10 — Outcomes

```
FIELD: Q1.10
TAGS: [foundation] [outcomes] [mandatory] [mechanism_test]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_1.q1_10.outcomes}} → 10_BRAND_CORE outcomes (bulleted)
VALIDATION: 3-5 items, each observable/measurable, not experiential
SYNTHESIS PROMPT:

  Outcomes are observable results, not experience claims.
  Reject "great experience", "happiness", "satisfaction".
  Refine to specific measurable results.

  Reference (Inhabitus):
    - Faster delivery
    - Lower cost
    - Predictable output
    - Scalable model

  User raw answer: {{raw_answer}}

  Synthesize. Output JSON: { outcomes: [...] }
```

## Q1.11 — Short definition per locale

```
FIELD: Q1.11
TAGS: [foundation] [short_definition] [mandatory] [per_locale] [no_translation]
SYNTHESIS: full (per locale)
TEMPLATE PLACEHOLDER: {{phase_1.q1_11.short_definitions}} → 10_BRAND_CORE short_definition_[locale] (per locale)
VALIDATION:
  - One per supported locale
  - Each 50-100 words
  - No blocklist hits (universal + locale-specific)
  - Natively written for each locale (not translated)
SYNTHESIS PROMPT (per locale):

  You are synthesizing the brand's short definition in {{locale_name}}.
  This is the most-quoted single piece of content — it appears in
  off-domain templates, "what is this brand" answers, and is the
  elevator pitch.

  Framework rules:
  - 50-100 words in {{locale_name}}
  - Reads like a structural fact, not a marketing line
  - References the thesis mechanism (Q1.4 resolution)
  - References value chain integration (Q1.6)
  - References differentiation (Q1.8)
  - No universal blocklist terms
  - No {{locale}} blocklist terms

  Already synthesized:
  - Entity type: {{synthesized.q1_3.type}}
  - Thesis resolution: {{synthesized.q1_5.resolution}}
  - Value chain effects: {{synthesized.q1_6.effects}}

  Reference (Inhabitus, in PT):
    "A Inhabitus é uma plataforma de produção habitacional
    verticalmente integrada. Industrializa a construção,
    standardiza o design e remove intermediários para produzir
    comunidades residenciais com custo mais baixo e maior
    previsibilidade."

  User raw answer (in {{locale_name}}): {{raw_answer[locale]}}

  Synthesize natively in {{locale_name}}. Output: single string.

EXAMPLE (PT locale):
  raw: "Inhabitus é uma empresa inovadora que transforma o setor da habitação com soluções de qualidade."
  synthesized: "A Inhabitus é uma plataforma de produção habitacional verticalmente integrada que standardiza o design e industrializa a construção para produzir comunidades residenciais com custo mais baixo e maior previsibilidade."
```

---

# Phase 2 — Audience

## Q2.1 — Audience framing

```
FIELD: Q2.1
TAGS: [audience] [framing] [mandatory] [mechanism_test]
SYNTHESIS: full
TEMPLATE PLACEHOLDERS:
  - {{phase_2.q2_1.primary_insight}} → 11_AUDIENCE audience_framing.primary_insight
  - {{phase_2.q2_1.consequence}} → 11_AUDIENCE audience_framing.consequence
VALIDATION: mechanism-based not demographic; specific structural condition
SYNTHESIS PROMPT:

  Audience framing must be mechanism-based, not demographic.
  Demographics ("millennials") don't survive analysis. Structural
  conditions ("exposure to inefficient housing production") do.

  Reference (Inhabitus):
    primary_insight: "The target user is defined by exposure to
                      inefficient housing production and fragmented
                      financing."
    consequence: "Low margin for error makes cost predictability,
                  delivery predictability, and financing efficiency
                  more relevant than aspirational features."

  User raw answer: {{raw_answer}}

  Synthesize. Output JSON: { primary_insight, consequence }

EXAMPLE:
  raw: {
    primary_insight: "Young professionals looking for nice homes",
    consequence: "They want quality at a good price"
  }
  synthesized: {
    primary_insight: "Low-mid to mid income households exposed to inefficient cost structure and fragmented financing.",
    consequence: "Low buffer makes cost predictability and execution confidence more important than aspirational features."
  }
```

## Q2.2 — Segment count and primary

```
FIELD: Q2.2
TAGS: [audience] [segments] [mandatory]
SYNTHESIS: direct (count) + light (names ordering)
TEMPLATE PLACEHOLDERS:
  - {{phase_2.q2_2.segments[*].id}} → SEG_001, SEG_002, ... (auto-generated)
  - {{phase_2.q2_2.segments[*].name}} → 11_AUDIENCE per-segment names
  - {{phase_2.q2_2.primary_segment_index}} → 11_AUDIENCE primary segment marker
VALIDATION: 1-6 segments
```

## Q2.3 — Per segment (looped)

For each segment, the seven sub-questions:

### Q2.3.1 — Segment name and triggers

```
FIELD: Q2.3.1
TAGS: [audience] [segment] [triggers] [per_locale]
SYNTHESIS:
  - name: light (preserve user's brand-specific naming)
  - triggers: full (per locale)
TEMPLATE PLACEHOLDERS:
  - {{phase_2.segments[].name}} → 11_AUDIENCE segment.name
  - {{phase_2.segments[].triggers[locale]}} → 11_AUDIENCE segment.triggers per locale
VALIDATION: 5-8 triggers per locale, each a natural phrase a staff member might use
SYNTHESIS PROMPT (triggers, per locale):

  Triggers are natural phrasings that, if a staff member used them
  in a prompt, would clearly signal this segment.

  Reference example (Inhabitus SEG_001 "Age-Advantaged First Buyer", EN):
    - first-time buyer
    - first home
    - starter home
    - age 25-35
    - young couple

  Reference (PT):
    - primeiro comprador
    - primeira casa
    - casa de início
    - jovem casal
    - 25 a 35 anos

  User raw triggers in {{locale_name}}: {{raw_answer}}

  Refine to natural prompt-phrasings staff would actually use.
  Output: list of strings in {{locale_name}}.
```

### Q2.3.2 — Criteria

```
FIELD: Q2.3.2
TAGS: [audience] [segment] [criteria]
SYNTHESIS: full
TEMPLATE PLACEHOLDERS:
  - {{phase_2.segments[].criteria.structural_conditions}} → bulleted
  - {{phase_2.segments[].criteria.financial_position}}
  - {{phase_2.segments[].criteria.stage_of_life}}
VALIDATION: each condition is mechanistic
```

### Q2.3.3 — Primary condition

```
FIELD: Q2.3.3
TAGS: [audience] [segment] [primary_condition]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_2.segments[].primary_condition}}
VALIDATION: single sentence, structural
SYNTHESIS PROMPT:

  The primary condition is the single most important condition that
  defines this segment. One sentence. Mechanistic.

  Reference (Inhabitus SEG_001):
  "Entry capital is no longer the main blocking variable. New
  bottleneck: trust plus payment structure."

  User raw answer: {{raw_answer}}
```

### Q2.3.4 — Core problem

```
FIELD: Q2.3.4
TAGS: [audience] [segment] [problem] [mechanism_test]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_2.segments[].core_problem}}
VALIDATION: structural friction, not desire
SYNTHESIS PROMPT:

  Core problem is a structural friction, not an outcome desire.

  Wrong: "They want to own a home"
  Right: "They face a down payment barrier that exceeds household
         savings capacity"

  Reference (Inhabitus SEG_001):
  "Ability to buy may exist. Confidence to commit remains weak due
  to opaque pricing, delivery uncertainty, and post-purchase cost
  surprises."

  User raw answer: {{raw_answer}}
```

### Q2.3.5 — Drivers

```
FIELD: Q2.3.5
TAGS: [audience] [segment] [drivers]
SYNTHESIS: full (verify each is a decision driver, not a value)
TEMPLATE PLACEHOLDER: {{phase_2.segments[].drivers}} bulleted
VALIDATION: 3-5 items, each a decision-shaping factor
```

### Q2.3.6 — Non-drivers

```
FIELD: Q2.3.6
TAGS: [audience] [segment] [non_drivers] [boundary_check]
SYNTHESIS: full (verify each is a non-driver competitors might wrongly assume)
TEMPLATE PLACEHOLDER: {{phase_2.segments[].non_drivers}} bulleted
VALIDATION: 3-5 items
```

### Q2.3.7 — System fit and significance

```
FIELD: Q2.3.7
TAGS: [audience] [segment] [fit] [significance]
SYNTHESIS: full
TEMPLATE PLACEHOLDERS:
  - {{phase_2.segments[].system_fit}}
  - {{phase_2.segments[].why_segment_matters}}
```

## Q2.4 — Common conditions

```
FIELD: Q2.4
TAGS: [audience] [common] [boundary_check]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_2.q2_4.common_conditions}} bulleted
VALIDATION: 1-5 items, each a condition true across all segments
```

## Q2.5 — Non-targets

```
FIELD: Q2.5
TAGS: [audience] [non_targets] [boundary_check]
SYNTHESIS: full
TEMPLATE PLACEHOLDERS:
  - {{phase_2.q2_5.non_targets[].description}}
  - {{phase_2.q2_5.non_targets[].reason_for_exclusion}}
VALIDATION: 3-5 pairs; each reason references brand mechanism
```

## Q2.6 — Decision thresholds

```
FIELD: Q2.6
TAGS: [audience] [decision_thresholds] [mandatory]
SYNTHESIS: full
TEMPLATE PLACEHOLDERS:
  - {{phase_2.q2_6.access_condition}}
  - {{phase_2.q2_6.structure_condition}}
  - {{phase_2.q2_6.confidence_condition}}
SYNTHESIS PROMPT:

  Three thresholds. Each is a condition that, when met, contributes
  to commitment. All three must be met for conversion.

  Reference (Inhabitus):
    access: "Credit access exists or becomes plausible"
    structure: "Total payable structure is materially more manageable
                than fragmented alternatives"
    confidence: "Delivery, inclusions, and trade-offs are
                 understandable and credible"

  User raw answer: {{raw_answer}}
```

---

# Phase 3 — Pillars

## Q3.1 — Pillar count and names

```
FIELD: Q3.1
TAGS: [pillars] [count] [mandatory]
SYNTHESIS:
  - count: direct
  - display names: light (verify per-locale natively written, not translated)
TEMPLATE PLACEHOLDERS:
  - {{phase_3.pillars[].id}} → PIL_001, PIL_002, ... (auto-generated)
  - {{phase_3.pillars[].display_name[locale]}}
VALIDATION: 3-8 pillars
```

## Q3.2 — Per pillar (looped, 7 sub-questions)

### Q3.2.1 — Pillar problem

```
FIELD: Q3.2.1
TAGS: [pillar] [problem] [mechanism_test]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_3.pillars[].problem}}
SYNTHESIS PROMPT:

  Each pillar's problem is the specific inefficiency or friction it
  resolves. Must be distinct from other pillars' problems.

  Reference (Inhabitus PIL_004_1 "MMC-Based Production"):
    problem: "Manual construction increases variability"

  Reference (Inhabitus PIL_004_4 "Cost Structure Engineering"):
    problem: "Fragmented financing (consumer credit, retailer
              financing, leasing, cash) inflates blended cost"

  User raw answer for this pillar: {{raw_answer}}

  Already synthesized other pillars' problems (avoid overlap):
  {{other_pillars.problems}}

  Synthesize.
```

### Q3.2.2 — Pillar mechanism

```
FIELD: Q3.2.2
TAGS: [pillar] [mechanism] [mechanism_test]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_3.pillars[].mechanism}}
SYNTHESIS PROMPT:

  Mechanism is what the brand DOES — operational, not values.

  Reference (Inhabitus):
    PIL_004_1 mechanism: "LSF, modular, precast, 3D"
    PIL_004_2 mechanism: "T2/T3 standardized typologies"
    PIL_004_4 mechanism: "Bundling setup costs into mortgage"

  Must NOT be:
  - A value ("we prioritize quality")
  - A benefit ("better customer experience")
  - A buzzword ("innovation", "AI-driven")

  User raw answer: {{raw_answer}}
  Already synthesized (problem): {{synthesized.q3_2_1.problem}}

  Synthesize.
```

### Q3.2.3 — Decision rule: accept_when

```
FIELD: Q3.2.3
TAGS: [pillar] [decision_rules] [accept_when] [mandatory]
SYNTHESIS: full (verify each condition is testable)
TEMPLATE PLACEHOLDER: {{phase_3.pillars[].decision_rule.accept_when}} bulleted
SYNTHESIS PROMPT:

  Accept_when conditions are positive triggers for using this
  pillar's mechanism. Each must be testable against a real scenario.

  Reference (Inhabitus PIL_004_1 MMC):
    accept_when:
      - method reduces execution time
      - method reduces variability
      - method scales across units

  User raw answer: {{raw_answer}}

  Synthesize. Each condition should pass the test: "Could a real
  scenario be evaluated against this?"
```

### Q3.2.4 — Decision rule: reject_when

```
FIELD: Q3.2.4
TAGS: [pillar] [decision_rules] [reject_when] [critical] [mandatory]
SYNTHESIS: full (CRITICAL — this drives proposal evaluation in analytical mode)
TEMPLATE PLACEHOLDER: {{phase_3.pillars[].decision_rule.reject_when}} bulleted
SYNTHESIS PROMPT:

  Reject_when conditions are the most important field for proposal
  evaluation. When a proposed action triggers reject_when, the
  proposal contradicts this pillar.

  Reference (Inhabitus PIL_004_2 Standardized Design):
    reject_when:
      - user needs exceed typology limits
      - rigidity creates functional mismatch

  Reference (Inhabitus PIL_004_1 MMC):
    reject_when:
      - method is site-specific only
      - method increases coordination complexity

  Each condition must be a real scenario in which using the
  mechanism would do harm or fail.

  User raw answer: {{raw_answer}}

  Synthesize with extra care. Output must be testable conditions,
  not opinions.
```

### Q3.2.5 — Effect

```
FIELD: Q3.2.5
TAGS: [pillar] [effect]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_3.pillars[].effect}}
SYNTHESIS PROMPT:

  Effect is observable change when mechanism is applied. Use arrows
  to show direction when applicable.

  Reference (Inhabitus):
    PIL_004_1 effect: "Time ↓, cost ↓, predictability ↑"
    PIL_004_4 effect: "Cost stability ↑"

  User raw answer: {{raw_answer}}
```

### Q3.2.6 — Context weights

```
FIELD: Q3.2.6
TAGS: [pillar] [weights] [mandatory]
SYNTHESIS: direct (numeric values from sliders)
TEMPLATE PLACEHOLDER: {{phase_3.pillars[].weight_by_context.[CONTEXT]}}
VALIDATION: integer 0-5 per context
```

### Q3.2.7 — Segment modifiers

```
FIELD: Q3.2.7
TAGS: [pillar] [segment_modifiers]
SYNTHESIS: direct (numeric values from sliders)
TEMPLATE PLACEHOLDER: {{phase_3.pillars[].segment_modifiers.[SEG_ID]}}
VALIDATION: integer -2 to +2 per segment
```

## Q3.3 — Contradictions

```
FIELD: Q3.3
TAGS: [pillars] [contradictions] [trade_off_framing]
SYNTHESIS: full
TEMPLATE PLACEHOLDERS:
  - {{phase_3.q3_3.contradictions[].tension}}
  - {{phase_3.q3_3.contradictions[].interpretation}}
  - {{phase_3.q3_3.contradictions[].resolution_rule}}
SYNTHESIS PROMPT:

  Each contradiction is a real tension between pillars. Must include:
  - tension: short label ("Standardization vs flexibility")
  - interpretation: what this tension is about (1-2 sentences)
  - resolution_rule: how to resolve when it arises (1-2 sentences)

  Reference (Inhabitus):
    tension: "Standardization vs flexibility"
    interpretation: "Standardization reduces cost; flexibility
                     increases choice"
    resolution_rule: "Low buffer → prioritize standardization.
                      Functional mismatch → allow controlled
                      flexibility within typology limits."

  User raw answer: {{raw_answer}}
  Already synthesized pillars: {{synthesized.pillars}}

  Verify each contradiction is real (the two pillars genuinely pull
  opposite). Synthesize.
```

## Q3.4 — System principle

```
FIELD: Q3.4
TAGS: [pillars] [system_principle] [meta_rule] [mandatory]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_3.q3_4.system_principle}}
SYNTHESIS PROMPT:

  Single sentence. Meta-rule. Resolves any pillar tension when no
  specific contradiction applies.

  Reference (Inhabitus): "MMC-driven continuous optimization:
  reject non-scalable improvements."

  User raw answer: {{raw_answer}}
```

---

# Phase 4 — Voice

## Q4.1 — Voice identity

```
FIELD: Q4.1
TAGS: [voice] [identity] [mandatory] [competitor_test]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_4.q4_1.identity}} bulleted (20_VOICE_CORE identity)
SYNTHESIS PROMPT:

  Voice identity descriptors should have edge. Reject generics
  ("professional", "friendly", "approachable"). Each descriptor
  should fail the competitor test.

  Reference (Inhabitus): "Engineering-first", "System-driven",
  "Operator mindset"

  User raw answer: {{raw_answer}}

  Synthesize. Output: list of 3-5 strings.
```

## Q4.2 — Voice traits

```
FIELD: Q4.2
TAGS: [voice] [traits] [mandatory]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_4.q4_2.traits}} bulleted (20_VOICE_CORE traits)
SYNTHESIS PROMPT:

  Traits are texture qualities — how sentences feel to read. More
  granular than identity.

  Reference (Inhabitus): "Precise", "Technical", "Controlled",
  "Rational"

  User raw answer: {{raw_answer}}
```

## Q4.3 — Core rule

```
FIELD: Q4.3
TAGS: [voice] [core_rule] [mandatory] [meta_rule]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_4.q4_3.core_rule}} (20_VOICE_CORE core_rule)
SYNTHESIS PROMPT:

  Single sentence. The irreducible voice principle.

  Reference (Inhabitus): "Explain systems, not emotions."

  User raw answer: {{raw_answer}}
```

## Q4.4 — Brand-specific forbidden phrases

```
FIELD: Q4.4
TAGS: [voice] [forbidden_phrases] [brand_specific]
SYNTHESIS: light (verify each is brand-specific not generic AI cliché)
TEMPLATE PLACEHOLDER: {{phase_4.q4_4.forbidden_phrases}} bulleted
VALIDATION: each entry is specific to this brand
```

## Q4.5 — Formatting constraints

```
FIELD: Q4.5
TAGS: [voice] [formatting]
SYNTHESIS: direct (enum values from selects)
TEMPLATE PLACEHOLDERS:
  - {{phase_4.q4_5.em_dashes}}
  - {{phase_4.q4_5.exclamation_marks}}
  - {{phase_4.q4_5.oxford_comma}}
  - {{phase_4.q4_5.heading_case}}
  - {{phase_4.q4_5.emoji_policy}}
```

## Q4.6 — Register samples per locale

```
FIELD: Q4.6
TAGS: [voice] [register_samples] [per_locale] [per_register] [no_translation]
SYNTHESIS: light (verify register compliance, no blocklist)
TEMPLATE PLACEHOLDER: {{phase_4.q4_6.register_samples[locale][register]}}
VALIDATION:
  - 60-200 words per sample
  - In specified locale (natively)
  - No blocklist hits
  - Matches register rules (see NINEYARDS_PLATFORM_CONSTANTS register_rules)
SYNTHESIS PROMPT (per locale, per register):

  Verify the user's submitted sample for {{register_name}} register
  in {{locale_name}}. Check against:
  - Register rules: {{register_rules[register]}}
  - Universal blocklist: {{universal_blocklist}}
  - Locale blocklist: {{locale_blocklists[locale]}}
  - Voice identity: {{synthesized.q4_1.identity}}
  - Voice traits: {{synthesized.q4_2.traits}}
  - Core rule: {{synthesized.q4_3.core_rule}}

  If sample complies: output verbatim.
  If minor issues (cliché terms, slight off-voice): refine while
  preserving substance.
  If substantively wrong (wrong register, wrong language): output
  SYNTHESIS_FAILURE.

  User sample: {{raw_answer}}
```

## Q4.7 — Sensitive situation playbook

```
FIELD: Q4.7
TAGS: [voice] [sensitive_playbook] [per_locale]
SYNTHESIS: full (per locale, per situation type)
TEMPLATE PLACEHOLDER: {{phase_4.q4_7.sensitive_playbook[locale]}}
VALIDATION: each situation type has accountable-structure-compliant playbook
SYNTHESIS PROMPT:

  Each situation type's playbook should describe how the brand
  handles it, following accountable structure:
  acknowledge → cause → action → timeline

  Reference (Inhabitus delays):
    "State cause explicitly. Provide new date with confidence.
    Describe what changes for the buyer in concrete terms."

  User raw answer for {{situation_type}}: {{raw_answer}}

  Synthesize.
```

## Q4.8 — Off-domain templates

```
FIELD: Q4.8
TAGS: [voice] [off_domain] [per_locale] [per_register]
SYNTHESIS: full
TEMPLATE PLACEHOLDER: {{phase_4.q4_8.off_domain_templates[locale][register]}}
VALIDATION:
  - Must contain [BRAND_NAME] and [TOPIC] placeholders
  - 1-3 sentences
  - Matches register rules
SYNTHESIS PROMPT:

  The off-domain template fires when a prompt is outside brand
  scope. Each register has its own variant.

  Reference (Inhabitus, EN, considered):
    "That's outside what [BRAND_NAME] covers. [BRAND_NAME] is
    [SHORT_DEFINITION]. If you're working on [TOPIC], a resource
    focused on that area would be more useful."

  User raw answer: {{raw_answer}}

  Verify placeholders present. Refine for register compliance.
```

---

# Phase 5 — Lexicon (per locale)

## Q5.1 — Signature phrases

```
FIELD: Q5.1
TAGS: [lexicon] [signature_phrases] [per_locale] [brand_owned]
SYNTHESIS: full (verify each is brand-owned/recognizable)
TEMPLATE PLACEHOLDER: {{phase_5.q5_1.signature_phrases[locale]}} bulleted
SYNTHESIS PROMPT:

  Signature phrases must be specific enough that they belong to
  this brand. A phrase that could appear in any brand's marketing
  is not signature.

  Reference (Inhabitus PT):
    - "O preço fixado antes do início da obra"
    - "Mover-se em 90 dias a partir da assinatura"

  Reference (Inhabitus EN — examples from framework):
    - "Cost does not surprise. It accumulates."
    - "Structure removes negotiation."
    - "Efficiency is designed, not discovered."

  Verify each user phrase passes the "could any brand say this?"
  test. Refine or drop.

  User raw answer in {{locale_name}}: {{raw_answer}}
```

## Q5.2 — Preferred substitutions

```
FIELD: Q5.2
TAGS: [lexicon] [substitutions] [per_locale]
SYNTHESIS: light (verify each pair is meaningful)
TEMPLATE PLACEHOLDER: {{phase_5.q5_2.preferred_substitutions[locale]}}
```

## Q5.3 — Punctuation policy

```
FIELD: Q5.3
TAGS: [lexicon] [punctuation] [per_locale]
SYNTHESIS: direct
TEMPLATE PLACEHOLDER: {{phase_5.q5_3.punctuation_policy[locale]}}
```

## Q5.4 — Brand-specific blocklist

```
FIELD: Q5.4
TAGS: [lexicon] [blocklist] [per_locale] [brand_specific]
SYNTHESIS: full (per entry: verify bad/good examples align)
TEMPLATE PLACEHOLDER: {{phase_5.q5_4.brand_specific_blocklist[locale]}}
SYNTHESIS PROMPT:

  Each banned term entry should include: term, bad example using it,
  why it fails (mechanism reason), better version.

  Verify each user entry. Refine bad/good examples for clarity.

  User raw entry: {{raw_answer}}
```

## Q5.5 — Native AI defaults confirmation

```
FIELD: Q5.5
TAGS: [lexicon] [native_blocklist] [per_locale] [confirmed_defaults]
SYNTHESIS: light (validate which platform-defaults the user accepted)
TEMPLATE PLACEHOLDER: {{phase_5.q5_5.native_blocklist[locale]}}
```

---

# Phase 6 — Channel specs (per locale)

All channel specs questions: **synthesis = light or direct** (mostly select values and overrides). No full synthesis needed.

Mappings:
- Q6.1 channel length overrides → {{phase_6.q6_1.channel_length_overrides[locale]}}
- Q6.2 forbidden openers → {{phase_6.q6_2.forbidden_openers[locale]}}
- Q6.3 hashtag policy → {{phase_6.q6_3.hashtag_policy}}
- Q6.4 emoji policy → {{phase_6.q6_4.emoji_policy}}
- Q6.5 CTA policy → {{phase_6.q6_5.cta_policy}}
- Q6.6 cross-channel rules → {{phase_6.q6_6.cross_channel_rules}}

---

# Phase 7 — Examples library (per locale)

```
FIELD: Q7.2 (looped per example)
TAGS: [examples] [per_locale] [channel:X] [segment:Y] [register:Z] [mode:M]
SYNTHESIS: full (per example — highest quality stakes)
TEMPLATE PLACEHOLDER: {{phase_7.examples[]}} → 31_EXAMPLES_LIBRARY_[LOCALE] structured entries
SYNTHESIS PROMPT:

  This example will be used as a shape anchor by the brand reasoning
  system at runtime. It must be exemplary — clean voice, mechanism-
  first, blocklist-free, register-appropriate, channel-appropriate.

  Configuration:
  - Locale: {{locale}}
  - Channel: {{channel}}
  - Segment: {{segment}}
  - Register: {{register}}
  - Situation: {{situation}}
  - Mode: {{mode}}
  - Sub-shape (if analytical): {{sub_shape}}
  - Proposal variant (if proposal): {{proposal_variant}}

  Already synthesized context:
  - Brand short definition: {{synthesized.q1_11[locale]}}
  - Pillars involved: {{pillars_invoked.synthesized}}
  - Voice register sample: {{synthesized.q4_6[locale][register]}}
  - Channel specs: {{synthesized.q6[locale][channel]}}

  Universal blocklist: {{universal_blocklist}}
  Locale blocklist: {{locale_blocklists[locale]}}

  User raw example output: {{raw.output}}
  User raw "why it works" annotations: {{raw.why_it_works}}

  Verify the example:
  1. Length appropriate to channel
  2. Register matches
  3. Invokes specified pillars by mechanism (not abstract reference)
  4. Avoids blocklists
  5. Native to locale (not translated)

  If exemplary: output verbatim with refined annotations.
  If minor issues: refine while preserving user's specifics.
  If substantively wrong: SYNTHESIS_FAILURE.

  Annotations ("why it works") should reference specific framework
  mechanisms ("invokes PIL_004_1 via phrase X", "opens with
  mechanism not aspiration", "applies accountable structure"). Refine
  vague annotations into specific ones.
```

---

# Tag-driven synthesis rules summary

When the platform processes interview answers, it iterates through each field and applies synthesis based on tags. The decision tree:

```
For each interview field:
  if synthesis_type == "direct":
    → copy raw_answer to template_value (no LLM)
  elif synthesis_type == "light":
    → format raw_answer per template requirements (no content change)
  elif synthesis_type == "full":
    → load field-specific synthesis prompt
    → substitute placeholders with context
    → call Claude API
    → validate output:
        - run universal blocklist scan
        - run locale-specific blocklist scan (if per_locale)
        - check length constraints
        - check structural completeness
        - check cross-references (IDs resolve)
        - check no placeholder leaks
    → if validation fails: retry (up to 3x with refined prompt)
    → if still failing: mark SYNTHESIS_FAILURE for admin review
    → if success: save to interview_answers.synthesized
  elif synthesis_type == "none":
    → skip (field not used in file generation)
```

---

# Validation gates per tag

| Tag | Validation gate |
|---|---|
| `[mechanism_test]` | Output references a verb/action/process, not a state |
| `[competitor_test]` | Output cannot plausibly describe a competitor |
| `[boundary_check]` | Output establishes a clear boundary (exclusion or threshold) |
| `[mandatory]` | File generation blocked if synthesis fails |
| `[per_locale]` | One value per supported locale, each natively synthesized |
| `[no_translation]` | Locale variants captured separately from user, not produced by translation |
| `[critical]` | Stricter validation; admin review required even on success |
| `[meta_rule]` | Output is a single sentence/rule |
| `[brand_owned]` | Output passes brand-specificity test |
| `[trade_off_framing]` | Output presents both sides of a tension |

---

# How this maps to admin workflow

In the admin panel's request detail page (Tab: Answers), each field shows three layers:

1. **Raw** — user's input
2. **Synthesized** — Claude-refined output (editable)
3. **Approved** — what file generation will use (admin's choice between raw, synthesized, or hand-edited)

Default selection on approved is "synthesized" — admin reviews and either accepts, edits further, or overrides with raw if synthesis went too far.

For fields marked `SYNTHESIS_FAILURE`, admin must hand-write the value before file generation can proceed.

---

# Cost and timing

Per interview, synthesis runs ~30-50 LLM calls (one per full-synthesis field), with parallel execution where dependencies allow:

- Wall-clock: 30-90 seconds total
- Anthropic API cost: $0.50-$2.00 per request
- The admin can review synthesized output as it streams in

---

# Iteration and quality improvement

The synthesis prompts are versioned alongside the framework. As the platform sees more brands, prompts can be refined based on:

- Synthesis failures (which prompts produce SYNTHESIS_FAILURE most often)
- Admin edits (which synthesized outputs are most heavily edited)
- Quality scores (admin marks each synthesized field 1-5 stars)

Monthly review process recommended. Reference brand library expands over time to cover more industries and patterns.

---

End of field synthesis map.
