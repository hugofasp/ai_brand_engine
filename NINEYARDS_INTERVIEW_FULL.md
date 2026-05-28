# ai brand engine — Interview Content (Full)

> Complete specification of all 7 interview phases. Every question
> includes the prompt, why it matters, the answer structure, validation
> rules, orientative language for brand owners, and the tags used by
> downstream file generation.
>
> Companion to NINEYARDS_BUILD_SPEC.md.

---

## Methodology recap

Each question is captured with these elements:

- **ID** — stable identifier (e.g., Q1.1, Q3.2.4)
- **Question** — the actual text shown to the user
- **Why this matters** — system rationale (shown as italic sub-text)
- **Orientative language** — guidance shown in a callout box that pushes brand owners toward mechanism-first answers
- **Answer structure** — the shape of captured data
- **Tags** — metadata used by file generation and validation
- **Validation** — rules that catch incomplete or off-pattern answers

Universal validation pattern: any free-text answer is scanned against the universal AI-default blocklist. If it contains banned terms ("innovative", "cutting-edge", "leader in", etc.), the user sees a non-blocking warning suggesting refinement. The system records the answer but flags it for admin review.

---

# Phase 1 — Foundation

Populates `10_BRAND_CORE.txt`. ~11 questions.

## Q1.1 — Brand name and locale

**Question:** "What's the brand called, and in which language(s) does it operate?"

**Why this matters:** Anchors every other answer. Drives file naming, locale-specific files, and the system check output.

**Orientative:** "Primary language is what you operate in most. Other supported languages should be added only if you'll actually create content in them — not aspirationally. Each additional language doubles roughly four files of work."

**Answer structure:**
```
brand_name: text (required, max 120 chars)
locale_primary: select from ISO 639-1 (required)
locale_secondary: multi-select from ISO 639-1 (optional, max 5)
```

**Tags:** `[foundation] [locale_config] [mandatory]`

**Validation:** Required fields filled. Locales must be valid ISO codes.

---

## Q1.2 — Channel-locale defaults

**Question:** "Do any of your channels always operate in a specific language, regardless of who's writing them?"

**Why this matters:** Some brands have stable per-channel locale patterns (e.g., Portuguese brand whose LinkedIn is always in English). Without this, the system infers locale from the staff member's prompt language, which can be wrong.

**Orientative:** "If you don't have hard rules here, leave them as 'follows prompt' — the system handles it via inference. Only set channel defaults when you really mean 'this channel is always in language X'."

**Answer structure:** Per channel from the channel list (INSTAGRAM, LINKEDIN, EMAIL, INVESTOR_MEMO, TECHNICAL_DOC, WEB_HERO, PRESS_RELEASE, INTERNAL_MEMO):
```
channel: 'follows_prompt' | locale_code
```

**Tags:** `[foundation] [locale_config] [optional]`

**Skip behavior:** Only shown if `locale_secondary` is non-empty. For mono-lingual brands, this question is skipped.

---

## Q1.3 — Entity definition

**Question:** "Describe what your brand actually is, structurally. We're not looking for marketing language — we want the operational truth. What type of organization is it? How is it structured? What does it focus on? Where does it operate? What's its specialization?"

**Why this matters:** The brand's "physical" definition — what it does in the world, not how it presents itself. Used for off-domain detection and as the substrate for proposal evaluation in ANALYTICAL_MODE.

**Orientative:** "Avoid 'we're a leader in...' or 'we specialize in delivering...'. Aim for the kind of definition you'd put in a regulatory filing or a wikipedia infobox. Concrete, structural, factual."

**Answer structure (multi-field group):**
```
name: text (required, defaults to Q1.1 brand_name)
type: text (required) — e.g., "Housing Production Platform"
structure: text (required) — e.g., "Vertically Integrated Developer"
focus: text (required) — e.g., "Residential Communities"
region: text (required) — e.g., "Portugal"
specialization: text (required) — e.g., "Modern Methods of Construction (MMC)"
```

**Tags:** `[foundation] [entity] [mandatory] [mechanism_test]`

**Validation:** Reject phrases like "leader in", "specialist in delivering", "innovative", "cutting-edge", "best-in-class". Show inline warning: "That sounds aspirational. What does the company *do* in concrete terms?"

---

## Q1.4 — Thesis: problem and causes

**Question:** "What problem does your brand exist to solve, and what specifically causes that problem? We want the *mechanisms* — the specific reasons the problem exists — not the symptoms."

**Why this matters:** The thesis is the brand's central argument. It drives every pillar, every contradiction, every analytical-mode response.

**Orientative:** "Most brands get this wrong by stating the problem as a feeling ('housing is unaffordable'). We want mechanisms. Not 'housing is expensive' but 'housing is expensive because production is fragmented, design is non-standardized, and intermediary margins stack.' Each cause should be something you could point to in the world."

**Answer structure:**
```
problem: textarea (required, max 200 chars) — single-sentence statement
causes: list (required, 3-5 items, each max 120 chars)
```

**Tags:** `[foundation] [thesis] [mandatory] [mechanism_test]`

**Validation:** Causes list must have 3-5 items. Each cause must include a verb or describe an action/process (not just a state). Universal blocklist scan.

---

## Q1.5 — Thesis: resolution

**Question:** "How does your brand resolve that problem? Not 'we make it better' — what's the specific approach? What does your brand do that addresses each of the causes you just named?"

**Why this matters:** The resolution is the bridge from problem to brand. It tells the system what the brand's intervention is.

**Orientative:** "If the causes were specific mechanisms, the resolution should be specific mechanisms too. A short formula works ('Industrialize + Integrate + Standardize'). A vague aspiration doesn't ('We make housing better')."

**Answer structure:**
```
resolution: text (required, max 200 chars)
```

**Tags:** `[foundation] [thesis] [mandatory] [mechanism_test]`

---

## Q1.6 — Value chain

**Question:** "Walk through your value chain. What are the stages of how you create and deliver value, from earliest input to final delivery? Then, what's the cumulative effect of organizing these stages this particular way?"

**Why this matters:** The value chain is the brand's structural advantage. It's also what makes the brand non-generic — competitors can copy positioning, but they can't easily copy a different value chain shape.

**Orientative:** "Each stage should be something concrete that happens. Each effect should be something measurable or observable — not 'we deliver excellence' but 'margins are reduced because there are fewer intermediaries.'"

**Answer structure (two ordered lists):**
```
stages: list (required, 3-8 ordered items, each max 100 chars)
effects: list (required, 2-5 items, each max 100 chars)
```

**Tags:** `[foundation] [value_chain] [mandatory]`

---

## Q1.7 — Positioning

**Question:** "What category does your brand operate in — the broad space, not the specific niche? And what dimensions matter in that category — what are people choosing between when they pick a brand here?"

**Why this matters:** Positioning is where the brand sits relative to competitors. The dimensions define the choice space.

**Orientative:** "Category is the supermarket aisle. Axes are the variables on the back of the box. Avoid 'premium' or 'innovative' as axes — those describe how you market, not what you do."

**Answer structure:**
```
category: text (required, max 100 chars)
axes: list (required, 2-5 items, each max 80 chars)
```

**Tags:** `[foundation] [positioning] [mandatory]`

---

## Q1.8 — Differentiation

**Question:** "List 3-5 specific things your brand does that competitors structurally cannot. Not 'we do it better' — what can you literally do that they can't, and why?"

**Why this matters:** Differentiation is the moat. Structural claims hold up; surface-level claims evaporate.

**Orientative:** "If a competitor could write the same sentence about themselves, drop it. Differentiation only counts if it's structurally true for you and structurally not true for them."

**Answer structure:**
```
differentiators: list (required, 3-5 items, each max 120 chars)
```

**Tags:** `[foundation] [differentiation] [mandatory] [competitor_test]`

**Validation:** Each differentiator should pass a "competitor test" — show warning if the text could plausibly describe a competitor.

---

## Q1.9 — Negative definition

**Question:** "What is your brand NOT? Name 3-5 things you might be mistaken for, that you're explicitly not. This is often more powerful than what you are."

**Why this matters:** Negative definition is what the brand refuses to be. Used as a hard boundary check on proposals and content.

**Orientative:** "If you describe yourself as 'a housing platform', you might be mistaken for a traditional developer, an architecture firm, or a contractor. Naming these explicitly — 'not a traditional developer, not an architecture-only firm, not a contractor-only entity' — locks the boundaries."

**Answer structure:**
```
negative_definition: list (required, 3-5 items, each max 80 chars, format "not a/an X")
```

**Tags:** `[foundation] [negative_definition] [mandatory] [boundary_check]`

---

## Q1.10 — Outcomes

**Question:** "What 3-5 outcomes does your brand actually produce for customers? Not the experience — the outcomes."

**Why this matters:** Outcomes are the brand's promise expressed as observable results.

**Orientative:** "An outcome is something the customer ends up with that's measurably different. 'Faster delivery' (vs what they'd have otherwise) is an outcome. 'A great experience' is not."

**Answer structure:**
```
outcomes: list (required, 3-5 items, each max 60 chars)
```

**Tags:** `[foundation] [outcomes] [mandatory] [mechanism_test]`

---

## Q1.11 — Short definition per locale

**Question:** "Now distill all of the above into one paragraph: what is this brand and what does it do? Write this in [primary locale] first. Then, if you have other supported locales, write it natively in each one — not translated."

**Why this matters:** The most-quoted single piece of content in the entire system. Powers off-domain templates, "what is this brand" answers, elevator pitch. Must be natively written per locale — translation kills brand character.

**Orientative:** "If you struggle to write this without using 'innovative', 'leading', 'comprehensive', or 'cutting-edge', go back to Q1.4-Q1.9 and pull from the mechanisms you named there. The good short definition reads like a structural fact, not a marketing line."

**Answer structure:**
```
short_definitions: {
  [locale_code]: textarea (required for each supported locale, 50-100 words)
}
```

**Tags:** `[foundation] [short_definition] [mandatory] [per_locale] [no_translation]`

**Validation:** Run universal blocklist against each locale's text. Reject if cliché terms appear. One per supported locale is mandatory.

---

# Phase 2 — Audience

Populates `11_AUDIENCE.txt`. ~6 questions + 7 sub-questions per segment.

## Q2.1 — Audience framing

**Question:** "What's the structural condition that defines your audience? We're not asking demographics — we're asking what shared *position* puts someone in your audience. For example: 'exposure to inefficient housing production and fragmented financing' is a structural condition. 'Millennials' is not."

**Why this matters:** Meta-definition that segments inherit from. Anchors every segment to a shared structural truth.

**Orientative:** "Demographics don't survive analysis — people in the same demographic make different choices for different reasons. Structural conditions do survive — they predict behavior. Aim for what's *structurally true* about your audience."

**Answer structure:**
```
basis: fixed value 'mechanism-based' (read-only display)
primary_insight: textarea (required, max 200 chars) — one sentence
consequence: textarea (required, max 200 chars) — one sentence
```

**Tags:** `[audience] [framing] [mandatory] [mechanism_test]`

---

## Q2.2 — Segment count and primary

**Question:** "How many distinct audience segments do you serve? Then, which one is the most central — the one that defines the rest? That becomes your primary segment (the default when a prompt doesn't specify)."

**Why this matters:** Number of segments shapes the rest of Phase 2. Primary segment is the fallback for everything.

**Orientative:** "Typical range: 2-4 segments. Fewer than 2 = probably under-segmented. More than 4 = probably over-segmented. If you're not sure, start with 2-3."

**Answer structure:**
```
segment_count: number (required, 1-6)
segment_names: list (required, length = segment_count, each max 60 chars)
primary_segment_index: number (required, 0 to segment_count-1)
```

**Tags:** `[audience] [segments] [mandatory]`

---

## Q2.3.x — Per segment (looped for each)

For each segment, capture seven items. Implementation: render as a multi-tab interface, one tab per segment, with all sub-questions inside each tab.

### Q2.3.1 — Segment name and triggers

**Question:** "Name this segment. Then give us 5-8 trigger phrases per locale — words or short phrases that, if a staff member used them in a prompt, would clearly signal they're talking about this segment."

**Orientative:** "Triggers should be natural ways someone would actually phrase a prompt. 'first-time buyer', 'first home', 'starter unit', 'young couple looking to buy' — all good. 'demographic A' — not useful."

**Answer structure:**
```
id: SEG_001 / SEG_002 / SEG_003 (auto-generated)
name: text (required, max 60 chars, inherits from Q2.2)
triggers: {
  [locale_code]: list (required for each supported locale, 5-8 items)
}
```

**Tags:** `[audience] [segment] [triggers] [per_locale]`

### Q2.3.2 — Segment criteria

**Question:** "What are the structural conditions that put someone in this segment? Cover: structural conditions, financial position, life stage."

**Orientative:** "These are the conditions that, together, place someone in this segment. Specific. Mechanistic."

**Answer structure (multi-field):**
```
structural_conditions: list (required, 2-5 items)
financial_position: text (required, max 200 chars)
stage_of_life: text (required, max 200 chars)
```

**Tags:** `[audience] [segment] [criteria]`

### Q2.3.3 — Primary condition

**Question:** "In one sentence: what's the single most important condition that defines this segment? The one that, if you knew nothing else, would tell you they fit."

**Orientative:** "If you can name one structural truth that makes someone a member of this segment, that's the primary condition. Concrete."

**Answer structure:**
```
primary_condition: text (required, max 250 chars)
```

**Tags:** `[audience] [segment] [primary_condition]`

### Q2.3.4 — Core problem

**Question:** "What's this segment's core problem — the thing they're trying to resolve that brings them into your audience? Not 'they want a home' — what specific structural friction are they facing?"

**Orientative:** "The core problem must be a structural friction they're facing, not an outcome they desire. 'They face a down payment barrier on traditional purchases' is structural. 'They want their dream home' is not."

**Answer structure:**
```
core_problem: text (required, max 250 chars)
```

**Tags:** `[audience] [segment] [problem] [mechanism_test]`

### Q2.3.5 — Drivers

**Question:** "What 3-5 things drive their decisions? What do they actually optimize for?"

**Orientative:** "Drivers are the things they actually weigh when deciding. If you've named the wrong drivers, your content will speak past them."

**Answer structure:**
```
drivers: list (required, 3-5 items, each max 80 chars)
```

**Tags:** `[audience] [segment] [drivers]`

### Q2.3.6 — Non-drivers

**Question:** "What 3-5 things do NOT drive their decisions, that competitors might wrongly assume drive them?"

**Orientative:** "Non-drivers are equally important. If competitors are aiming at the wrong things, knowing what to NOT emphasize is a competitive advantage."

**Answer structure:**
```
non_drivers: list (required, 3-5 items, each max 80 chars)
```

**Tags:** `[audience] [segment] [non_drivers] [boundary_check]`

### Q2.3.7 — System fit and significance

**Question:** "Why does your brand fit this segment? And why does this segment matter to your brand?"

**Orientative:** "Two-part answer. First: what about your brand structure serves this segment specifically. Second: why this segment is important to your business model — what they unlock for you."

**Answer structure (two textareas):**
```
system_fit: textarea (required, max 300 chars)
why_segment_matters: textarea (required, max 300 chars)
```

**Tags:** `[audience] [segment] [fit] [significance]`

---

## Q2.4 — Common conditions across segments

**Question:** "What conditions are true across all your segments? What do they all share, that distinguishes your overall audience from people who aren't your audience at all?"

**Orientative:** "These are the conditions that everyone in your audience meets, regardless of which specific segment they're in. They define the outer edge of your audience."

**Answer structure:**
```
common_conditions: list (required, 1-5 items, each max 120 chars)
```

**Tags:** `[audience] [common] [boundary_check]`

---

## Q2.5 — Non-targets

**Question:** "Who is explicitly NOT your audience, even though they might superficially seem like a fit? Name 3-5 non-target profiles and why each is excluded."

**Orientative:** "These are people who look like they should be in your audience but aren't. Naming them explicitly prevents your brand reasoning system from misclassifying them."

**Answer structure (list of pairs):**
```
non_targets: list (required, 3-5 items, each with:)
  description: text (max 150 chars)
  reason_for_exclusion: text (max 200 chars)
```

**Tags:** `[audience] [non_targets] [boundary_check]`

---

## Q2.6 — Decision thresholds

**Question:** "What three conditions, when all met, lead your audience to actually commit (buy, sign, decide)?"

**Why this matters:** Used in proposal evaluation as criteria for whether a proposed change improves or impedes conversion.

**Orientative:** "Three thresholds: access (can they?), structure (does the offer's structure work for them?), confidence (do they trust it'll happen?). For any of your segments, what specifically constitutes each?"

**Answer structure:**
```
access_condition: textarea (required, max 200 chars)
structure_condition: textarea (required, max 200 chars)
confidence_condition: textarea (required, max 200 chars)
```

**Tags:** `[audience] [decision_thresholds] [mandatory]`

---

# Phase 3 — Pillars

Populates `12_PILLARS.txt`. ~4 base questions + 7 sub-questions per pillar.

## Q3.1 — Pillar count

**Question:** "How many distinct pillars does your brand have? Each pillar should be a separate mechanism by which your brand creates value. Typical range: 4-7 pillars."

**Orientative:** "Fewer than 4 pillars usually means the brand is under-articulated. More than 7 usually means duplication. Aim for distinct mechanisms — each pillar should be doing something different from the others."

**Answer structure:**
```
pillar_count: number (required, 3-8)
pillar_names: list (required, length = pillar_count)
  each item: {
    id: PIL_001 / PIL_002 / etc. (auto-generated)
    display_name: {
      [locale]: text (required for each supported locale, max 60 chars)
    }
  }
```

**Tags:** `[pillars] [count] [mandatory]`

---

## Q3.2.x — Per pillar (looped)

For each pillar, capture seven items. Multi-tab interface, one tab per pillar.

### Q3.2.1 — Pillar problem

**Question:** "What problem does this pillar specifically address — what's the inefficiency or friction it resolves?"

**Orientative:** "Each pillar should resolve a different inefficiency. If two pillars address the same problem, consolidate them."

**Answer structure:**
```
problem: textarea (required, max 250 chars)
```

**Tags:** `[pillar] [problem] [mechanism_test]`

### Q3.2.2 — Mechanism

**Question:** "What's the mechanism — the specific thing your brand does that resolves that problem? Not a value, not a benefit. The literal mechanism."

**Orientative:** "If the problem is 'manual construction increases variability', the mechanism might be 'LSF, modular, precast, 3D printing'. Specific. Operational."

**Answer structure:**
```
mechanism: textarea (required, max 250 chars)
```

**Tags:** `[pillar] [mechanism] [mechanism_test]`

### Q3.2.3 — Decision rule: accept_when

**Question:** "When does this pillar's mechanism apply? Name 2-4 conditions under which using this mechanism is the right call."

**Orientative:** "Accept_when conditions are positive triggers — when these conditions hold, this pillar is in play."

**Answer structure:**
```
accept_when: list (required, 2-4 items, each max 100 chars)
```

**Tags:** `[pillar] [decision_rules] [accept_when] [mandatory]`

### Q3.2.4 — Decision rule: reject_when

**Question:** "When does this pillar's mechanism NOT apply, even if it's available? Name 2-4 conditions under which you shouldn't use this mechanism."

**Why this matters:** Critical for ANALYTICAL_MODE proposal evaluation. Reject_when conditions become test conditions for proposed actions — if a proposal would trigger reject_when, the proposal contradicts this pillar.

**Orientative:** "This is the most important field for evaluating proposals. Reject_when conditions are when the mechanism would do harm or fail. 'When user needs exceed typology limits' is a real reject_when. 'When we don't feel like it' is not."

**Answer structure:**
```
reject_when: list (required, 2-4 items, each max 100 chars)
```

**Tags:** `[pillar] [decision_rules] [reject_when] [critical] [mandatory]`

### Q3.2.5 — Effect

**Question:** "What's the effect when this pillar's mechanism is applied? What measurably changes?"

**Orientative:** "Use arrows to show direction: 'Time ↓, cost ↓, predictability ↑'. Or describe the observable change."

**Answer structure:**
```
effect: text (required, max 200 chars)
```

**Tags:** `[pillar] [effect]`

### Q3.2.6 — Context weights

**Question:** "For each context (the purposes content can serve), how heavily does this pillar weigh in shaping content or analysis? Score 0-5."

**Why this matters:** Drives pillar selection at runtime. A SALES prompt picks the highest-SALES-weighted pillars; an INVESTOR prompt picks the highest-INVESTOR-weighted ones.

**Orientative:** "0 = irrelevant for this context. 5 = THE pillar for this context. Most pillars are 2-4 in their primary contexts and 1-2 elsewhere. Don't be afraid of 0s — pillars should be specialized, not universal."

**Answer structure (sliders 0-5):**
```
weight_by_context: {
  SALES: number (0-5)
  INVESTOR: number (0-5)
  TECHNICAL: number (0-5)
  COMMUNITY: number (0-5)
  INTERNAL: number (0-5)
}
```

**Tags:** `[pillar] [weights] [mandatory]`

### Q3.2.7 — Segment modifiers

**Question:** "Does this pillar matter more or less for specific segments? Adjust by -2 to +2."

**Why this matters:** Allows the framework to emphasize different pillars for different audience segments within the same context.

**Orientative:** "If a pillar is universally relevant, leave all modifiers at 0. Use +1 or +2 only when this pillar is specifically more important for that segment than the base weight suggests. Use -1 or -2 when it's specifically less."

**Answer structure (sliders -2 to +2, one per segment):**
```
segment_modifiers: {
  [segment_id]: number (-2 to +2)
}
```

**Tags:** `[pillar] [segment_modifiers]`

---

## Q3.3 — Contradictions

**Question:** "What tensions exist between your pillars? Name 2-4 pairs that genuinely pull in opposite directions, and how you resolve each tension."

**Why this matters:** Documented contradictions become explicit trade-off framings in ANALYTICAL_MODE. They acknowledge that no system is tension-free, and they tell the framework how to handle the tension when it arises.

**Orientative:** "If your pillars never tension with each other, they're probably not specific enough. Real systems have trade-offs. Naming them is honest and useful."

**Answer structure (list of contradiction objects):**
```
contradictions: list (1-5 items)
  each item: {
    tension: text (max 100 chars) — e.g., "Standardization vs flexibility"
    interpretation: textarea (max 250 chars)
    resolution_rule: textarea (max 250 chars)
  }
```

**Tags:** `[pillars] [contradictions] [trade_off_framing]`

---

## Q3.4 — System principle

**Question:** "In one sentence: what's the single rule that resolves any pillar tension when no specific resolution applies?"

**Why this matters:** Meta-rule. When contradictions don't cover a specific situation, the system principle is the tiebreaker.

**Orientative:** "This is the meta-rule. 'When in doubt, prioritize cost reduction.' 'When in doubt, prioritize customer trust.' 'When in doubt, prioritize the operational system over a one-off optimization.' One sentence."

**Answer structure:**
```
system_principle: textarea (required, max 200 chars)
```

**Tags:** `[pillars] [system_principle] [meta_rule] [mandatory]`

---

# Phase 4 — Voice

Populates `20_VOICE_CORE.txt` (locale-agnostic) and `21_VOICE_FLEX_[LOCALE].txt` (one per locale).

## Q4.1 — Voice identity

**Question:** "How does your brand actually sound? Give us 3-5 descriptors that capture its identity. Not adjectives like 'professional' or 'friendly' — descriptors with character."

**Orientative:** "'Engineering-first', 'system-driven', 'operator mindset' — these have edge. 'Professional', 'approachable', 'modern' — these don't. If your descriptors could apply to any brand, push for sharper ones."

**Answer structure:**
```
identity: list (required, 3-5 items, each max 50 chars)
```

**Tags:** `[voice] [identity] [mandatory] [competitor_test]`

---

## Q4.2 — Voice traits

**Question:** "What 4-6 adjectives describe the texture of your voice? These are more granular than identity — the qualities of how sentences feel."

**Orientative:** "Texture traits: 'precise', 'controlled', 'rational', 'declarative'. Some brands lean 'rhythmic', 'lyrical', 'spacious'. Pick the 4-6 that describe how your sentences should feel to read."

**Answer structure:**
```
traits: list (required, 4-6 items, each max 40 chars)
```

**Tags:** `[voice] [traits] [mandatory]`

---

## Q4.3 — Core rule

**Question:** "What's the single irreducible voice principle? If your team had to remember only one rule about how the brand talks, what would it be?"

**Orientative:** "'Explain systems, not emotions.' 'Lead with mechanism, never with promise.' 'Numbers before adjectives.' One sentence. This rule should resolve most voice disagreements."

**Answer structure:**
```
core_rule: textarea (required, max 200 chars)
```

**Tags:** `[voice] [core_rule] [mandatory] [meta_rule]`

---

## Q4.4 — Brand-specific forbidden phrases

**Question:** "Beyond the universal AI-default blocklist we include automatically (words like 'innovative', 'cutting-edge', 'reimagine'), are there specific phrases your brand never uses? Phrases that, when you see them in a draft, you know need to be cut."

**Orientative:** "These are brand-specific. Maybe you've banned 'solution' (you use 'system' instead) or 'partner' (you use 'client' or 'customer'). List anything specific to your brand."

**Answer structure:**
```
forbidden_phrases: list (optional, 0-15 items, each max 60 chars)
```

**Tags:** `[voice] [forbidden_phrases] [brand_specific]`

---

## Q4.5 — Formatting constraints

**Question:** "Are there formatting choices your brand has decided on? Em dashes vs commas, exclamation marks allowed or banned, all-caps for emphasis or never, etc."

**Orientative:** "Pick what you've actually decided. Most brands haven't — and the LLM will use whatever feels right by default. Setting explicit rules removes that variability."

**Answer structure (multi-field group):**
```
em_dashes: 'allow' | 'forbid' | 'undecided'
exclamation_marks: 'allow' | 'forbid' | 'undecided'
all_caps_emphasis: 'allow' | 'forbid' | 'undecided'
oxford_comma: 'use' | 'omit' | 'undecided'
heading_case: 'sentence' | 'title' | 'lowercase' | 'undecided'
emoji_policy: 'allow' | 'forbid' | 'specific_channels_only' | 'undecided'
specific_emoji_channels: list (if emoji_policy = 'specific_channels_only')
```

**Tags:** `[voice] [formatting]`

---

## Q4.6 — Register samples (per register, per locale)

**Question (looped — 4 registers × N locales):** "Show us what your brand sounds like in [REGISTER] register, in [LOCALE]. Write a 60-120 word sample piece that demonstrates the register. The topic can be anything within your brand's domain."

The 4 registers and their default uses:
- **Precise** — INVESTOR_MEMO, TECHNICAL_DOC
- **Considered** — LINKEDIN, longform WEB, PRESS_RELEASE
- **Conversational** — INSTAGRAM, EMAIL, INTERNAL_MEMO
- **Accountable** — used when situation = SENSITIVE (delays, complaints, etc.)

**Orientative (varies per register):**
- For Precise: "Dense, claim+mechanism per sentence. Numbers in opening clause. No metaphor."
- For Considered: "Clear claims with one memorable line per paragraph. Light rhythm allowed."
- For Conversational: "Shorter sentences, contractions allowed. Same mechanism logic, friendlier surface."
- For Accountable: "Direct, no euphemism. Acknowledge → cause → action → timeline. No defensiveness."

**Answer structure:**
```
register_samples: {
  [locale]: {
    precise: textarea (required, 60-200 words)
    considered: textarea (required, 60-200 words)
    conversational: textarea (required, 60-200 words)
    accountable: textarea (required, 60-200 words)
  }
}
```

**Tags:** `[voice] [register_samples] [per_locale] [per_register] [no_translation]`

**Validation:** Each sample scanned against universal blocklist. Warnings shown for cliché terms.

---

## Q4.7 — Sensitive situation playbook (per locale)

**Question:** "When something goes wrong — delays, complaints, price changes, closures, refunds — how does your brand handle each? Write a one-paragraph playbook per sensitive situation type, in [LOCALE]."

**Orientative:** "These playbooks become the brand's accountable structure under pressure. The framework will apply them when it detects a sensitive context. Be specific about what your brand always includes (e.g., 'always state the cause', 'always commit to a new date')."

**Answer structure (per locale):**
```
sensitive_playbook: {
  [locale]: {
    delays: textarea (required, 50-200 words)
    complaints: textarea (required, 50-200 words)
    price_changes: textarea (required, 50-200 words)
    closures: textarea (required, 50-200 words)
    refunds: textarea (required, 50-200 words)
  }
}
```

**Tags:** `[voice] [sensitive_playbook] [per_locale]`

---

## Q4.8 — Off-domain response templates (per register, per locale)

**Question:** "When someone asks your brand reasoning system about something outside your domain, how should it respond? Write a refusal template per register, per locale. The system will substitute brand name and topic at runtime."

**Orientative:** "The off-domain template fires when the topic is outside your brand's scope. Each register has its own version — a precise refusal sounds different from a conversational one. Use the placeholders [BRAND_NAME], [SHORT_DEFINITION], and [TOPIC] where the system should substitute values."

**Answer structure (per locale):**
```
off_domain_templates: {
  [locale]: {
    precise: textarea (required, 1-3 sentences, must contain [BRAND_NAME] and [TOPIC])
    considered: textarea (required, 1-3 sentences, must contain [BRAND_NAME] and [TOPIC])
    conversational: textarea (required, 1-3 sentences, must contain [BRAND_NAME] and [TOPIC])
    accountable: textarea (required, 1-3 sentences, must contain [BRAND_NAME] and [TOPIC])
  }
}
```

**Tags:** `[voice] [off_domain] [per_locale] [per_register]`

**Validation:** Must contain `[BRAND_NAME]` and `[TOPIC]` placeholders. Run blocklist scan.

---

# Phase 5 — Lexicon

Populates `22_LEXICON_[LOCALE].txt`. ~5 questions per locale.

## Q5.1 — Signature phrases (per locale)

**Question:** "What 5-15 phrases does your brand own — phrases unique enough that when someone reads them, they recognize you? Write these in [LOCALE]."

**Orientative:** "Signature phrases are recognizable. 'Cost does not surprise. It accumulates.' is signature — it's specific enough to belong to one brand. 'Quality and innovation' is not. If your phrase could appear in any brand's marketing, it's not signature."

**Answer structure (per locale):**
```
signature_phrases: {
  [locale]: list (required, 5-15 items, each max 120 chars)
}
```

**Tags:** `[lexicon] [signature_phrases] [per_locale] [brand_owned]`

---

## Q5.2 — Preferred substitutions (per locale)

**Question:** "What 10-20 X-not-Y vocabulary preferences does your brand have? Words you specifically use, instead of common alternatives."

**Orientative:** "Example pairs: 'system not solution', 'mechanism not approach', 'client not customer', 'unit not home'. These are small choices, but consistency across them creates a recognizable lexicon."

**Answer structure (per locale, list of pairs):**
```
preferred_substitutions: {
  [locale]: list (required, 5-25 items)
    each item: { use: text, instead_of: text }
}
```

**Tags:** `[lexicon] [substitutions] [per_locale]`

---

## Q5.3 — Punctuation and formatting policy (per locale)

**Question:** "Any locale-specific punctuation or formatting preferences? Quotation marks ("" vs «» vs „"), spacing conventions, list formatting, etc."

**Orientative:** "Different languages have different conventions. Portuguese uses «» quote marks in some contexts. Spanish uses inverted question marks. Specify your brand's choices."

**Answer structure (per locale, multi-field):**
```
punctuation_policy: {
  [locale]: {
    quotation_marks: '""' | '«»' | '„"' | 'mixed' | 'other'
    other_notes: textarea (optional)
  }
}
```

**Tags:** `[lexicon] [punctuation] [per_locale]`

---

## Q5.4 — Brand-specific banned terms (per locale)

**Question:** "Beyond the universal blocklist (English AI clichés) and the native AI defaults (which we'll pre-suggest), are there words or phrases specific to your brand or industry that you ban? Show each banned term with an example of bad usage and a rewrite."

**Orientative:** "These are industry-specific or brand-specific clichés. In real estate: 'luxury', 'exclusive', 'discerning buyers'. In tech: 'frictionless', 'AI-powered', 'next-generation'. List what's specific to your context."

**Answer structure (per locale, list of triples):**
```
brand_specific_blocklist: {
  [locale]: list (optional, 0-30 items)
    each item: {
      term: text (max 50 chars)
      bad_example: textarea (max 200 chars)
      why_it_fails: text (max 150 chars)
      better_version: textarea (max 200 chars)
    }
}
```

**Tags:** `[lexicon] [blocklist] [per_locale] [brand_specific]`

---

## Q5.5 — Native AI defaults confirmation (per locale)

**Question:** "We've pre-loaded common AI-default phrases in [LOCALE] that LLMs tend to use. Review and confirm which apply to your brand, add any we missed."

**Orientative:** "The platform suggests a starter list (e.g., for PT: 'descubra', 'transforme', 'experiência única', 'soluções inovadoras'). Confirm each one — accept, reject, or modify. Add brand-specific ones we wouldn't know."

**Answer structure (per locale, presented as a checklist with add functionality):**
```
native_blocklist: {
  [locale]: list (auto-pre-filled with 30-50 platform defaults; user can confirm/reject/edit/add)
    each item: {
      term: text
      bad_example: textarea
      why_it_fails: text
      better_version: textarea
      accepted: boolean
    }
}
```

**Tags:** `[lexicon] [native_blocklist] [per_locale] [confirmed_defaults]`

**Implementation note:** Platform maintains a curated list of common AI defaults per locale (PT, ES, FR, IT, DE, EN+). User reviews the suggestions, can reject any that don't apply to their brand, and adds their own. This makes Phase 5 faster and ensures coverage even when brand owners can't think of clichés themselves.

---

# Phase 6 — Channel specs

Populates `30_CHANNEL_SPECS_[LOCALE].txt`. Mostly platform defaults; questions only for brand-specific deviations. ~6 questions per locale.

## Q6.1 — Channel length deviations

**Question:** "We use sensible defaults for each channel's length (Instagram 80-150 chars, LinkedIn 600-1200, etc.). Do you want to deviate from any defaults for [LOCALE]?"

**Orientative:** "Most brands use defaults. Reasons to deviate: your audience is in a market with different norms (Portuguese runs longer than English; add ~20% for PT length defaults), or you've made a specific brand choice (always-short LinkedIn posts as a positioning move, etc.)."

**Answer structure (per locale, optional per channel):**
```
channel_length_overrides: {
  [locale]: {
    [channel]: {
      min_chars: number (optional)
      max_chars: number (optional)
      note: text (optional)
    }
  }
}
```

**Tags:** `[channels] [length] [per_locale] [optional]`

**Skip default:** Show defaults inline so user can see what they're accepting if they skip.

---

## Q6.2 — Forbidden openers (per locale)

**Question:** "Are there specific opening phrases your brand never uses for [LOCALE]?"

**Orientative:** "Common ones to ban: 'Hi there!', 'Hope you're well', 'Just checking in', 'I hope this finds you well'. Add any specific to your brand."

**Answer structure (per locale):**
```
forbidden_openers: {
  [locale]: list (optional, 0-15 items)
}
```

**Tags:** `[channels] [forbidden_openers] [per_locale]`

---

## Q6.3 — Hashtag policy

**Question:** "What's your hashtag policy for social channels?"

**Answer structure:**
```
hashtag_policy: {
  instagram: {
    enabled: 'always' | 'never' | 'on_request'
    max_count: number (default 0)
    case: 'lowercase' | 'camelCase' | 'mixed'
  }
  linkedin: {
    enabled: 'always' | 'never' | 'on_request'
    max_count: number (default 3)
    case: 'lowercase' | 'camelCase' | 'mixed'
  }
}
```

**Tags:** `[channels] [hashtags]`

---

## Q6.4 — Emoji policy

**Question:** "What's your emoji policy?"

**Answer structure:**
```
emoji_policy: {
  instagram: 'forbid' | 'allow_one_hook' | 'allow_freely'
  linkedin: 'forbid' | 'allow_one_hook' | 'allow_freely'
  email: 'forbid' | 'allow_subject_only' | 'allow_freely'
  internal: 'forbid' | 'allow_freely'
}
```

**Tags:** `[channels] [emoji]`

---

## Q6.5 — CTA conventions

**Question:** "How do CTAs (calls-to-action) work for your brand? Banned phrases like 'click here', 'learn more'? Specific preferred CTAs?"

**Answer structure:**
```
cta_policy: {
  forbidden_ctas: list (optional)
  preferred_ctas: list (optional) — phrases the brand actually uses
  notes: textarea (optional)
}
```

**Tags:** `[channels] [cta]`

---

## Q6.6 — Cross-channel rules

**Question:** "Any rules that apply across all your channels that we should make explicit?"

**Orientative:** "Examples: 'Never use rhetorical questions as openers.' 'Numbers always specific, never rounded unless explicitly an estimate.' 'No 'we' statements without a mechanism attached.'"

**Answer structure:**
```
cross_channel_rules: list (optional, 0-10 items, each max 150 chars)
```

**Tags:** `[channels] [cross_channel_rules]`

---

# Phase 7 — Examples library

Populates `31_EXAMPLES_LIBRARY_[LOCALE].txt`. This is the labor-intensive phase. Target: 30-45 fully-filled examples per locale.

The interview presents examples in a guided builder where users can:
- Pick a channel + segment + register combination
- See what's needed for that combination
- Submit examples until coverage is sufficient

## Q7.1 — Examples target

**Question:** "We recommend 30-45 examples per locale, spanning your primary channels. The system works without examples but produces more generic outputs. Investing 5-10 minutes per example pays off significantly. Are you willing to commit to the minimum 20 examples now, with the rest added later?"

**Orientative:** "Examples are the highest-leverage piece of content. Each example is a piece of finished, on-brand output that the system uses as a shape anchor. More examples = more accurate brand matching. Fewer = more reliance on rules alone."

**Answer structure:**
```
example_commitment: 'full_45' | 'minimum_20' | 'skip_for_now'
```

**Tags:** `[examples] [commitment]`

**Skip behavior:** If 'skip_for_now', flag the request as needing examples post-delivery. Admin can prompt later.

---

## Q7.2.x — Per example (looped, target count per Q7.1)

For each example, capture in a guided form:

### Q7.2.1 — Channel and configuration

```
channel: select from configured channels (required)
segment: select from configured segments (required)
register: select from {precise, considered, conversational, accountable} (required)
situation: select from {normal, sensitive} (required)
mode: 'content_generation' | 'content_improvement' | 'analytical_open' | 'analytical_proposal' (required)
locale: select from supported locales (required)
```

### Q7.2.2 — Trigger prompt

**Question:** "What prompt would a staff member type to want this kind of output? Write a realistic prompt."

```
prompt: textarea (required, max 300 chars)
```

### Q7.2.3 — Pillars invoked

**Question:** "Which 2-3 pillars does this example invoke? (Pick from your configured pillars.)"

```
pillars_invoked: list (required, 2-3 items, from configured pillars)
```

### Q7.2.4 — The example output itself

**Question:** "Write the finished output. Match the channel's typical length. Apply your voice, registers, and rules — this is the gold-standard shape."

```
output: textarea (required, length appropriate to channel)
```

### Q7.2.5 — Why it works

**Question:** "What makes this on-brand? List 2-4 reasons."

```
why_it_works: list (required, 2-4 items)
```

### Q7.2.6 — Common traps avoided

**Question:** "What did you NOT do here that would be tempting? Banned-term avoidance, generic phrasing avoided, etc."

```
common_traps_avoided: list (optional, 0-4 items)
```

**Tags per example:** `[examples] [per_locale] [channel:X] [segment:Y] [register:Z] [mode:M]`

---

## Example coverage targets

The interview tracks coverage and prompts the user to fill gaps. Target distribution per locale:

| Category | Target |
|---|---|
| INSTAGRAM (various segments, registers) | 5-8 |
| LINKEDIN | 5-8 |
| EMAIL (sales, customer, internal) | 5-8 |
| INVESTOR_MEMO | 3 |
| TECHNICAL_DOC | 3 |
| WEB_HERO | 3-5 |
| PRESS_RELEASE | 2-3 |
| INTERNAL_MEMO | 2-3 |
| SENSITIVE (across channels) | 5 |
| ANALYTICAL — open questions | 3-5 |
| ANALYTICAL — proposal evaluations | 3-5 |

**Per locale total: 30-45 examples.**

The interview shows a coverage tracker. The user can submit/save as they go. Final delivery doesn't block on full coverage — admin sees the count and can deliver with whatever's been provided.

---

# Interview behavior summary

## Auto-save
Every input blur saves to `interview_answers.answers` JSONB at the appropriate path. Save status indicator briefly shows "Saved".

## Phase transitions
Between phases: a full-screen takeover card explaining what the next phase covers + a "Begin Phase X" CTA.

## Phase summary
After each phase: a summary card listing all answers, allowing inline edits before proceeding.

## Resume
Returning to `/interview/[requestId]` restores the last incomplete question. Mid-phase resumes go to the specific question.

## Mobile
Fully responsive. The interview is recommended for desktop (set expectation on landing), but mobile is supported.

## Skip behavior
Optional questions are clearly marked. Required questions block forward navigation. Skipped optional questions can be returned to via the phase summary.

## Validation timing
- Inline validation on blur (format, required, blocklist)
- Phase-level validation on phase transition (cross-question consistency)
- Final validation on submit (completeness check)

## Help
Every question has a "?" tooltip with extended explanation. The orientative language is shown in-place by default; the tooltip provides additional examples or edge-case guidance.

---

# Total interview surface

- **Phase 1 (Foundation):** ~11 questions
- **Phase 2 (Audience):** ~6 base questions + 7 per segment (typically 2-4 segments) = ~20-34 total
- **Phase 3 (Pillars):** ~4 base questions + 7 per pillar (typically 4-7 pillars) = ~32-53 total
- **Phase 4 (Voice):** ~8 questions, some per-locale (multipliers)
- **Phase 5 (Lexicon):** ~5 questions per locale
- **Phase 6 (Channels):** ~6 questions per locale
- **Phase 7 (Examples):** 1 commitment question + 20-45 example entries per locale

**Total time investment:** 30-90 minutes depending on locale count and example depth. Most mono-lingual brands finish in 45-60 minutes if they have prepared answers.

**Recommended UX:** Allow saving and returning. Most brand owners need 2-3 sessions to complete.

---

End of interview content specification.
