# ai brand engine — Platform Constants

> Universal data shared across all clients: the universal AI-default
> blocklist, channel defaults per locale, register rules, reference
> brand exemplars.
>
> These are platform infrastructure — maintained by the nineyards
> team, not provided by clients. Used by file generation, synthesis
> layer, and validation.
>
> Companion to NINEYARDS_BUILD_SPEC.md.

---

# Storage location

```
/templates/constants/
├── universal_blocklist.json
├── locale_blocklists/
│   ├── en.json
│   ├── pt.json
│   ├── es.json
│   └── [other locales].json
├── channel_defaults.json
├── locale_length_multipliers.json
├── register_rules.json
└── reference_brands/
    ├── inhabitus/    (full file pack as exemplar)
    └── [other reference brands]/
```

---

# 1. Universal AI-default blocklist

Used by `20_VOICE_CORE.txt` (universal) and as a baseline check at any locale. Each entry has the banned term + a bad-usage example + a rewrite that shows the on-brand alternative.

The list should reach ~80 entries at launch. Below is the canonical starting set. The platform team should iterate on this as new clichés are observed in client outputs.

## Storage format (universal_blocklist.json)

```json
[
  {
    "term": "discover",
    "bad_example": "Discover the future of housing with our innovative communities.",
    "why_it_fails": "applies to any developer, no mechanism, AI-default opener",
    "better_version": "Standardized T2 and T3 units. Final price agreed before construction begins."
  },
  {
    "term": "elevate",
    "bad_example": "We elevate the way you live.",
    "why_it_fails": "aspirational without mechanism; meaningless verb",
    "better_version": "Modular assembly compresses build time by 40 percent."
  },
  ...
]
```

## Starting blocklist (canonical list — full text)

The platform's starting universal blocklist:

| Term | Bad-usage example | Why it fails | Rewrite pattern |
|---|---|---|---|
| discover | "Discover the future of X" | AI-default opener, no mechanism | Lead with the specific mechanism |
| elevate | "We elevate the way you live" | Aspirational, no mechanism | Name the specific improvement |
| transform | "Transform your daily routine" | Empty promise | Quantify the change |
| unlock | "Unlock new possibilities" | Marketing cliché | Name the specific outcome |
| reimagine | "We reimagine what X can be" | Implies novelty without naming it | State what's specifically different |
| redefine | "We redefine X" | Same as reimagine | State the specific redefinition |
| seamless | "A seamless experience" | Vague, means nothing | Describe the specific simplification |
| we're proud to announce | "We're proud to announce X" | Announcement boilerplate | Lead with the news |
| journey | "Begin your X journey" | Anthropomorphizes transaction | Name the first concrete step |
| cutting-edge | "Our cutting-edge approach" | Time-bound puffery | Describe what's specifically different |
| future-proof | "A future-proof solution" | Unfalsifiable | State the specific durability mechanism |
| end-to-end | "End-to-end service" | Generic; everyone claims this | List the actual stages covered |
| holistic | "A holistic approach" | Vague | Name what's specifically integrated |
| synergy | "Creating synergy" | Buzzword | Name the specific multiplier effect |
| ecosystem | "Our ecosystem" | Overused metaphor | Describe the actual network |
| foster | "We foster innovation" | Vague verb | Name the specific enablement |
| fuel | "Fuel your growth" | Marketing cliché | Quantify the growth driver |
| ignite | "Ignite your potential" | Hyperbolic | Name the specific catalyst |
| unleash | "Unleash X" | Hyperbolic | Describe the actual release of capability |
| robust | "Robust solution" | Vague descriptor | Describe the specific resilience |
| scalable solution | "A scalable solution" | Buzzword | Describe the actual scaling mechanism |
| best-in-class | "Best-in-class X" | Unsubstantiated claim | Cite the specific benchmark |
| world-class | "World-class X" | Same as best-in-class | Cite specifics |
| revolutionary | "Revolutionary approach" | Hype, almost never true | State what's specifically different |
| paradigm shift | "A paradigm shift in X" | Buzzword | Describe the actual structural change |
| game-changer | "A game-changer for X" | Hype | Name the specific change in conditions |
| game-changing | (same as above) | (same as above) | (same as above) |
| harness | "Harness the power of X" | Verb-as-cliché | Name the specific use |
| leverage | "Leverage our X" | Overused | Use simpler verb (use, apply) |
| empower | "Empower your team" | Vague benefit | Name the specific capability added |
| dive deep | "Let's dive deep" | Throat-clearing | Just start with the analysis |
| deep dive | (same as above) | (same as above) | (same as above) |
| in today's fast-paced | "In today's fast-paced X" | Empty time-context | Skip; lead with substance |
| in the ever-evolving | "In the ever-evolving X" | Same as above | Skip; lead with substance |
| where X meets Y | "Where innovation meets quality" | Pretentious framing | Name what specifically combines |
| curated | "A curated experience" | Marketing word | Describe the specific selection criteria |
| thoughtfully designed | "Thoughtfully designed" | Tautology | Describe the specific design choices |
| pioneering | "Pioneering X" | Self-claim of novelty | State the specific first |
| at the forefront | "At the forefront of X" | Position claim without substance | Cite the specific advantage |
| disrupting | "Disrupting the X industry" | Self-aggrandizing | Describe the specific disruption mechanism |
| democratizing | "Democratizing X" | Tech buzzword | Describe the specific access expansion |
| frictionless | "Frictionless X" | Vague | Quantify the friction removed |
| effortless | "Effortless X" | Same as frictionless | Same |
| state-of-the-art | "State-of-the-art X" | Time-bound puffery | Describe what's specifically advanced |
| next-generation | "Next-generation X" | Self-puffery | Name what's specifically new |
| innovative | "Our innovative X" | Saying you innovate isn't innovating | Describe the specific novelty |
| innovation | "Through innovation, we..." | Same as innovative | Cite the specific innovation |
| smart | "Smart X" (when not literal) | Used as filler | Replace with specific descriptor |
| intelligent | "Intelligent X" | Same as smart | Same |
| AI-powered | "AI-powered X" | Buzzword unless specifically using AI | Describe what AI is specifically doing |
| machine learning | (when used as buzzword) | Same as AI-powered | Same |
| dynamic | "Our dynamic X" | Vague | Replace with specific descriptor |
| comprehensive | "Comprehensive X" | Filler | Describe what's specifically covered |
| solutions | "Innovative solutions for X" | Generic | Name the specific solution |
| partner | "We partner with you" | Marketing softening | Describe the specific relationship |
| empowering | (same as empower) | Same | Same |
| transformative | (same as transform) | Same | Same |
| journey | (already listed) | | |
| premium | "Premium X" | Self-claim of quality | Cite the specific quality marker |
| luxury | "Luxury X" | Same as premium | Same |
| exclusive | "Exclusive X" | Marketing word | Describe the actual selection mechanism |
| bespoke | "Bespoke X" | Same as exclusive | Same |
| crafted | "Crafted with care" | Vague | Describe the specific care taken |
| artisanal | "Artisanal X" (when not literal) | Filler | Describe the specific small-batch process |
| boutique | "Boutique X" | Buzzword | Describe the specific scale/specialization |
| Take your X to the next level | (verbatim) | Cliché in full | Describe the next step specifically |
| Unleash the power of X | (verbatim) | Hype phrase | Describe the specific capability use |
| Embark on a X | (verbatim) | Anthropomorphizing | Just start |
| Imagine a world where | (verbatim) | Marketing trope | Describe the actual condition |
| What if you could | (verbatim) | Hypothetical hook | State what's possible |
| revolutionizing | (already redundant with revolutionary) | | |
| transformational | (same as transform) | | |
| at the heart of | "At the heart of X" | Filler phrasing | Describe what's specifically central |
| under the hood | "Under the hood" | Tired metaphor | Describe the underlying mechanism |
| moving the needle | "Moving the needle on X" | Buzzword | Quantify the change |
| 10x | (when used hyperbolically) | Tech bro cliché | Cite the specific multiplier |
| supercharge | "Supercharge your X" | Hype verb | Name the specific acceleration |
| boost | "Boost your X" | Filler verb | Quantify the increase |
| enhance | "Enhanced X" | Filler | Describe what's specifically added |
| optimize | "Optimize your X" (when generic) | Filler when not specific | Cite what's specifically optimized |
| streamline | "Streamline your X" | Filler verb | Describe the specific simplification |
| reimagining the way | (verbatim) | Trope | Describe what's specifically different |
| changing the game | (verbatim) | Same as game-changer | Same |
| moving forward | (verbatim) | Throat-clearing | Skip |
| stay tuned | (verbatim) | Newsletter cliché | Be specific about when/what |
| we're excited to | "We're excited to announce" | Filler emotion | Lead with the substance |
| we're thrilled to | (same as above) | Same | Same |
| at the end of the day | (verbatim) | Filler phrase | Skip |
| it's important to note that | (verbatim) | Filler phrase | Just state the point |
| as we all know | (verbatim) | Patronizing filler | Just state the point |
| as mentioned earlier | (verbatim) | Reference padding in single doc | Skip in standalone outputs |

(Continue iterating on this list as patterns emerge in production.)

---

# 2. Locale-specific AI-default blocklists

Each supported locale has its own list of locale-native AI clichés. Used in `22_LEXICON_[LOCALE]` as the "Native AI-default blocklist" section.

## Portuguese (pt.json) — starting list

```json
[
  {
    "term": "descubra",
    "bad_example": "Descubra o futuro da habitação com as nossas comunidades inovadoras.",
    "why_it_fails": "aplica-se a qualquer construtor; sem mecanismo; abertura típica de marketing genérico",
    "better_version": "Tipologias T2 e T3 standardizadas. Preço final fixado antes do início da obra."
  },
  {
    "term": "transforme",
    "bad_example": "Transforme a sua rotina diária.",
    "why_it_fails": "promessa vazia; sem mecanismo identificado",
    "better_version": "[specific mechanism the brand uses]"
  },
  {
    "term": "experiência única",
    "bad_example": "Uma experiência única de habitação.",
    "why_it_fails": "aplica-se a qualquer marca; não descreve nada concreto",
    "better_version": "[specific differentiation]"
  },
  {
    "term": "soluções inovadoras",
    "bad_example": "Soluções inovadoras para o problema da habitação.",
    "why_it_fails": "cliché de marketing tecnológico; sem mecanismo nomeado",
    "better_version": "[specific solution mechanism]"
  },
  {
    "term": "potencialize",
    "bad_example": "Potencialize o seu investimento.",
    "why_it_fails": "verbo de marketing; não descreve ação concreta",
    "better_version": "[specific capability or outcome]"
  },
  {
    "term": "revolucione",
    "bad_example": "Revolucione a sua forma de morar.",
    "why_it_fails": "hipérbole de marketing; raramente verdadeiro",
    "better_version": "[specific change being introduced]"
  },
  {
    "term": "eleve",
    "bad_example": "Eleve o seu padrão de vida.",
    "why_it_fails": "aspiracional sem mecanismo",
    "better_version": "[specific improvement quantified]"
  },
  {
    "term": "otimize",
    "bad_example": "Otimize a sua experiência.",
    "why_it_fails": "verbo vago de marketing",
    "better_version": "[specific optimization]"
  },
  {
    "term": "feito a pensar em si",
    "bad_example": "Espaços feitos a pensar em si.",
    "why_it_fails": "cliché de personalização vazio",
    "better_version": "[specific customization or product fit]"
  },
  {
    "term": "o seu lar dos sonhos",
    "bad_example": "Encontre o seu lar dos sonhos.",
    "why_it_fails": "cliché imobiliário; aspiracional sem substância",
    "better_version": "[specific property characteristics]"
  },
  {
    "term": "qualidade de vida superior",
    "bad_example": "Uma qualidade de vida superior.",
    "why_it_fails": "afirmação não verificável",
    "better_version": "[specific quality-of-life feature]"
  },
  {
    "term": "estilo de vida exclusivo",
    "bad_example": "Um estilo de vida exclusivo.",
    "why_it_fails": "marketing de prestígio sem substância",
    "better_version": "[specific exclusivity mechanism]"
  },
  {
    "term": "diferenciado",
    "bad_example": "Um produto diferenciado.",
    "why_it_fails": "auto-claim sem demonstração",
    "better_version": "[specific differentiator]"
  },
  {
    "term": "diferencial competitivo",
    "bad_example": "O nosso diferencial competitivo.",
    "why_it_fails": "buzzword de gestão",
    "better_version": "[specific competitive advantage]"
  },
  {
    "term": "ecossistema",
    "bad_example": "O nosso ecossistema de soluções.",
    "why_it_fails": "metáfora sobreutilizada",
    "better_version": "[specific network/system being referenced]"
  },
  {
    "term": "alavancar",
    "bad_example": "Alavancar oportunidades.",
    "why_it_fails": "buzzword de negócios",
    "better_version": "[specific use of the resource]"
  },
  {
    "term": "rumo a",
    "bad_example": "Rumo a um futuro melhor.",
    "why_it_fails": "frase aspiracional vazia",
    "better_version": "[specific direction with mechanism]"
  },
  {
    "term": "uma nova forma de",
    "bad_example": "Uma nova forma de viver.",
    "why_it_fails": "auto-claim de novidade sem substância",
    "better_version": "[specific new approach]"
  }
]
```

(Iterate this list as patterns emerge in PT-language outputs.)

## Spanish (es.json) — starter terms

`descubra` / `descubre`, `transforme`, `eleva tu`, `revoluciona`, `experiencia única`, `soluciones innovadoras`, `potencia`, `optimiza`, `hecho para ti`, `tu hogar ideal`, `calidad de vida superior`, `estilo de vida exclusivo`, `ecosistema`, `apalancar`, `nueva manera de`, `vanguardia`, `próximo nivel`

(Build out with bad/good examples for each per the PT pattern above.)

## French (fr.json), Italian (it.json), German (de.json)

Build per locale as supported locales are added. The platform team curates these lists. Native speakers review.

---

# 3. Channel defaults

Used by `30_CHANNEL_SPECS_[LOCALE]` as the baseline; per-locale and per-channel overrides from interview merge on top.

## channel_defaults.json

```json
{
  "INSTAGRAM": {
    "length_chars_default": "80-150",
    "structure_default": "hook | mechanism | outcome",
    "hashtags_default": "none unless explicitly requested",
    "emoji_default": "none",
    "cta_default": "implicit"
  },
  "LINKEDIN": {
    "length_chars_default": "600-1200",
    "structure_default": "hook \\n\\n body \\n\\n soft close",
    "hashtags_default": "3 max, lowercase",
    "emoji_default": "max 1 in hook",
    "cta_default": "soft, no 'click here'"
  },
  "EMAIL": {
    "subject_length_chars_default": "under 50",
    "subject_no_questions": true,
    "subject_no_emoji": true,
    "body_length_words_default": "80-200",
    "forbidden_openers_default": [
      "I hope this finds you well",
      "Just checking in",
      "Hope you're doing great",
      "Hi there",
      "I hope this email finds you"
    ]
  },
  "INVESTOR_MEMO": {
    "length_pages_default": "1 max",
    "opens_with_default": "number or specific claim"
  },
  "TECHNICAL_DOC": {
    "length_default": "variable",
    "structure_default": "claim → mechanism → constraint → effect"
  },
  "WEB_HERO": {
    "length_chars_default": "40-80",
    "structure_default": "claim plus mechanism in one breath"
  },
  "PRESS_RELEASE": {
    "length_words_default": "300-500",
    "opens_with_default": "factual lead"
  },
  "INTERNAL_MEMO": {
    "length_words_default": "80-250",
    "opens_with_default": "decision or status"
  }
}
```

---

# 4. Locale length multipliers

Used to adjust channel length defaults per locale. Portuguese, Spanish, etc. run longer than English for the same meaning.

## locale_length_multipliers.json

```json
{
  "en": 1.0,
  "pt": 1.20,
  "es": 1.15,
  "fr": 1.25,
  "it": 1.15,
  "de": 1.10,
  "ja": 0.60,
  "zh": 0.50
}
```

When generating `30_CHANNEL_SPECS_[LOCALE].txt`, the default length values are multiplied by the locale multiplier. So Instagram default of "80-150 chars" becomes ~"96-180 chars" in PT.

The platform's calibration text in the generated file:

```
## Locale length note
Length specifications in this file are calibrated for {{locale_name}}.
Portuguese typically runs ~20% longer than English; Spanish ~15%;
French ~25%; German ~10%; Italian ~15% for the same meaning.
```

---

# 5. Register rules

Used by the synthesis layer when verifying register samples (Q4.6).

## register_rules.json

```json
{
  "precise": {
    "use_for_channels": ["INVESTOR_MEMO", "TECHNICAL_DOC"],
    "rules": [
      "Dense — one claim plus mechanism per sentence",
      "Numbers in opening clause when applicable",
      "No metaphor, no rhythm tricks",
      "Active voice, declarative sentences"
    ],
    "anti_patterns": [
      "Long preambles",
      "Hedging phrases",
      "Marketing softeners"
    ]
  },
  "considered": {
    "use_for_channels": ["LINKEDIN", "WEB (longform)", "PRESS_RELEASE"],
    "rules": [
      "Clear claims with one memorable line per paragraph",
      "Light rhythm allowed",
      "No flourish",
      "Paragraphs of 2-4 sentences"
    ],
    "anti_patterns": [
      "Bullet lists without structural reason",
      "Rhetorical questions",
      "Throat-clearing intros"
    ]
  },
  "conversational": {
    "use_for_channels": ["INSTAGRAM", "EMAIL", "INTERNAL_MEMO"],
    "rules": [
      "Shorter sentences",
      "Contractions allowed",
      "Friendlier surface but same mechanism logic",
      "Direct address"
    ],
    "anti_patterns": [
      "Forced casualness ('hey!', 'amazing!')",
      "Emoji as register signaling",
      "Abandoning the mechanism for vibes"
    ]
  },
  "accountable": {
    "use_for_situations": ["SENSITIVE"],
    "applied_as_structure_over_register": true,
    "rules": [
      "Direct, no euphemism",
      "Structure: acknowledge → cause → action → timeline",
      "No defensiveness, no blame-shifting",
      "First person plural where appropriate"
    ],
    "anti_patterns": [
      "'Unfortunately', 'sadly', 'we regret to inform'",
      "Passive voice on the cause",
      "Vague timelines ('soon', 'shortly')",
      "Apologies without specific commitment"
    ]
  }
}
```

---

# 6. Reference brand library

For the synthesis layer (see `NINEYARDS_SYNTHESIS_LAYER.md`). These are full file packs of fictional or volunteered brands used as exemplars in synthesis prompts.

## Required reference brands (build during pre-launch)

1. **Inhabitus** (primary reference) — the Portuguese housing platform that drove the framework's development. Full file pack at `/templates/constants/reference_brands/inhabitus/`. Covers: industrial process orientation, mechanism-first voice, multi-segment audience, contradictions-aware pillars. Locale: PT primary, EN secondary.

2. **Synthetic reference: B2B SaaS** — a fictional or volunteered company in B2B software. Tests the framework against a different industry: subscription pricing model, technical audience, longer sales cycles. Locale: EN primary.

3. **Synthetic reference: Consumer goods** — a fictional or volunteered consumer product brand. Tests the framework against a different audience model: end-consumer focus, retail channels, brand-as-lifestyle. Locale: EN primary.

4. **Synthetic reference: Professional services** — consultancy or agency reference. Tests the framework's analytical mode at scale. Locale: EN + one secondary.

## Storage structure per reference brand

```
/templates/constants/reference_brands/[brand_slug]/
├── 10_BRAND_CORE.txt
├── 11_AUDIENCE.txt
├── 12_PILLARS.txt
├── 20_VOICE_CORE.txt
├── 21_VOICE_FLEX_[LOCALE].txt
├── 22_LEXICON_[LOCALE].txt
├── 30_CHANNEL_SPECS_[LOCALE].txt
├── 31_EXAMPLES_LIBRARY_[LOCALE].txt
└── metadata.json    (industry, locales, completion notes)
```

The synthesis layer pulls relevant sections from reference brands when shaping its prompts to Claude. For example, when synthesizing Q1.4 (thesis problem), the synthesis prompt includes the thesis problem from each reference brand as a few-shot example of "good" answers.

## Maintenance

Reference brand files are versioned and updated when the framework version bumps. The platform team is responsible for keeping reference brand files framework-current — they're the highest-leverage piece of platform infrastructure for output quality.

---

# 7. Versioning these constants

All platform constants are versioned. Major version bumps require:
- Update universal blocklist if new clichés have emerged
- Update locale-specific blocklists similarly
- Refresh reference brand files against new framework version
- Verify channel defaults still match real-world client usage
- Update locale length multipliers if data warrants

Each file in `/templates/constants/` has a `_version` field at the top. The platform's overall framework version tracks the latest version across all constants files.

---

# 8. Updates and review cycle

Recommend quarterly review of:
- Universal blocklist (add 5-10 new entries based on production observations)
- Locale blocklists (same)
- Reference brand files (ensure they exemplify current framework version)

Recommend bi-annual review of:
- Channel defaults (do they still match real-world platform usage?)
- Length multipliers (any new locales added?)
- Register rules (any new patterns observed worth codifying?)

---

End of platform constants specification.
