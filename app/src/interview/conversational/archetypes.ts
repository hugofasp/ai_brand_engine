/**
 * Brand archetype wheel — Hugo's communication-tone framework.
 *
 * Used in the conversational interview to translate technical brand-voice
 * decisions into concrete, picker-friendly choices. Instead of asking
 * "what's your register?", Claude writes the same hypothetical post in
 * 2-3 archetype voices and lets the user pick which feels right.
 *
 * The 12 archetypes are clustered into 4 motivation quadrants:
 *   Provide Structure  · Caregiver, Ruler, Creative
 *   Seek Paradise      · Innocent, Sage, Explorer
 *   Build a Connection · Everyman, Jester, Lover
 *   Leave a Mark       · Hero, Outlaw, Magician
 *
 * Each archetype carries:
 *   key       — stable id used in archetype_decisions
 *   name      — human label
 *   cluster   — motivation quadrant
 *   word      — single-word voice signature (the wheel's inner ring)
 *   voice     — 2-3 sentence description of how this voice talks
 *   patterns  — short list of recurring sentence-shape patterns
 *   sample    — one representative paragraph in this voice (English)
 *   maps_to   — framework-internal voice tokens this archetype implies
 */

export type ArchetypeCluster =
  | "Provide Structure"
  | "Seek Paradise"
  | "Build a Connection"
  | "Leave a Mark";

export type Archetype = {
  key: string;
  name: string;
  cluster: ArchetypeCluster;
  word: string;
  voice: string;
  patterns: string[];
  /** English sample (the default — used if no locale-specific sample
   * exists). */
  sample: string;
  /** Optional per-locale sample paragraphs. Keyed by ISO 639-1 code.
   * Hand-calibrated for locales where Hugo wants quality control over
   * how Claude presents voice choices. */
  samples?: Partial<Record<string, string>>;
  maps_to: {
    identity_descriptors: string[];
    traits: string[];
    register_lean:
      | "precise"
      | "considered"
      | "conversational"
      | "accountable";
  };
};

export const ARCHETYPES: Archetype[] = [
  {
    key: "caregiver",
    name: "Caregiver",
    cluster: "Provide Structure",
    word: "Service",
    voice:
      "Warm, attentive, reassuring. Foregrounds the customer's needs and the brand's responsibility to meet them. Avoids ego.",
    patterns: [
      "Opens with the customer's situation, not the brand's",
      "Frames work as care or support",
      "Soft hedges ('we can help', 'we're here for')",
    ],
    sample:
      "Buying your first home is more than a transaction. It's the start of a chapter you'll remember. We walk every step with you — clarifying paperwork, weighing trade-offs, answering the question at 9pm. You're not navigating this alone.",
    samples: {
      pt:
        "Comprar a primeira casa é mais do que assinar papéis. É o início de um capítulo que vai contar a alguém daqui a vinte anos. Acompanhamos cada passo consigo — esclarecemos a documentação, ajudamos a pesar opções, respondemos à pergunta às nove da noite. Não está sozinho neste processo.",
    },
    maps_to: {
      identity_descriptors: ["customer-first", "supportive", "patient"],
      traits: ["warm", "reassuring", "human-paced"],
      register_lean: "considered",
    },
  },
  {
    key: "ruler",
    name: "Ruler",
    cluster: "Provide Structure",
    word: "Control",
    voice:
      "Authoritative, ordered, command of detail. Foregrounds standards, scale, and proven systems. No hedging.",
    patterns: [
      "Declarative sentences ('We have built', 'We deliver')",
      "Numbers in opening clauses",
      "Compound nouns ('institutional discipline', 'execution standards')",
    ],
    sample:
      "Eleven years. 240 units delivered. Zero schedule overruns since 2022. We don't run a residential business on hope — we run it on a production system that the industry has spent forty years not building. The standard isn't a marketing claim. It's our P&L.",
    samples: {
      pt:
        "Onze anos. 240 unidades entregues. Zero atrasos de obra desde 2022. Não fazemos promoção imobiliária à base de previsões — fazemos com um sistema de produção que o sector demorou quarenta anos a não construir. O padrão não é discurso comercial. Está na nossa conta de exploração.",
    },
    maps_to: {
      identity_descriptors: ["systems-driven", "institutional", "exacting"],
      traits: ["controlled", "declarative", "precise"],
      register_lean: "precise",
    },
  },
  {
    key: "creative",
    name: "Creative",
    cluster: "Provide Structure",
    word: "Innovative",
    voice:
      "Imaginative, generative, idea-rich. Foregrounds making something that didn't exist before. Comfortable with metaphor.",
    patterns: [
      "Unusual juxtapositions",
      "Concrete-to-abstract leaps mid-paragraph",
      "First-person plural with a creative agenda ('we're working on…')",
    ],
    sample:
      "We started building a software product. We finished building a way of thinking about software products. The two aren't the same — and the gap between them is where most product teams quietly drown. We've spent six years closing it.",
    maps_to: {
      identity_descriptors: ["generative", "idea-led", "category-redefining"],
      traits: ["imaginative", "metaphor-tolerant", "rhythmic"],
      register_lean: "considered",
    },
  },
  {
    key: "innocent",
    name: "Innocent",
    cluster: "Seek Paradise",
    word: "Safety",
    voice:
      "Honest, simple, uncomplicated. Foregrounds doing the right thing plainly. No irony, no cleverness.",
    patterns: [
      "Short sentences",
      "Plain vocabulary",
      "Direct moral framing ('we believe', 'we do')",
    ],
    sample:
      "We make ice cream from milk. The milk comes from a farm in Idanha-a-Nova that we know by name. There are six flavours because six is enough. We don't add stabilisers. If something goes wrong, we put a sign on the door and we tell you what happened.",
    maps_to: {
      identity_descriptors: ["honest", "uncomplicated", "transparent"],
      traits: ["plain", "direct", "unhurried"],
      register_lean: "conversational",
    },
  },
  {
    key: "sage",
    name: "Sage",
    cluster: "Seek Paradise",
    word: "Wisdom",
    voice:
      "Considered, analytical, slightly removed. Foregrounds understanding the problem before claiming the solution. Comfortable with caveats.",
    patterns: [
      "Frames before claims ('The data on residential housing shows…')",
      "Acknowledges trade-offs",
      "Uses 'why' more than 'what'",
    ],
    sample:
      "The data on multifamily housing is clear: every additional unit produced at scale reduces median per-unit cost by 4–7%. What's less clear is why most developers stop scaling at 80 units. The answer isn't capital — it's governance. We've been studying it for five years.",
    samples: {
      pt:
        "Os dados sobre habitação multifamiliar são claros: cada unidade adicional produzida em escala reduz o custo mediano por unidade entre 4 e 7%. O que é menos claro é a razão pela qual a maioria dos promotores deixa de crescer aos 80 fogos. A resposta não está no capital — está na governança. É um tema que estudamos há cinco anos.",
    },
    maps_to: {
      identity_descriptors: ["analytical", "evidence-led", "calm"],
      traits: ["precise", "considered", "removed"],
      register_lean: "precise",
    },
  },
  {
    key: "explorer",
    name: "Explorer",
    cluster: "Seek Paradise",
    word: "Freedom",
    voice:
      "Independent, restless, frontier-oriented. Foregrounds going where the established path doesn't. Resists convention.",
    patterns: [
      "Distance from incumbents ('most agencies do X — we don't')",
      "Frontier metaphors (terrain, route, map)",
      "First-person singular tolerated in copy",
    ],
    sample:
      "Most consultancies sell you a deck. We sold our last client a working prototype on day three, then sold them three more over six months. The deck came later — as documentation, not deliverable. The route nobody walks is the only one worth pricing.",
    maps_to: {
      identity_descriptors: ["independent", "convention-breaking", "frontier"],
      traits: ["restless", "direct", "unhedged"],
      register_lean: "considered",
    },
  },
  {
    key: "everyman",
    name: "Everyman",
    cluster: "Build a Connection",
    word: "Belonging",
    voice:
      "Approachable, plain, peer-to-peer. Foregrounds being on the same team as the customer. No status, no jargon.",
    patterns: [
      "Contractions",
      "First-person plural inclusive ('we all know')",
      "Acknowledges ordinariness ('like everyone else, we…')",
    ],
    sample:
      "You don't need another tool. You need the tools you already pay for to actually talk to each other. That's what we built. We were tired of stitching together five SaaS subscriptions just to know how our team was doing, so we made the thing we wished existed.",
    maps_to: {
      identity_descriptors: ["peer-to-peer", "approachable", "no-bullshit"],
      traits: ["conversational", "contracted", "warm"],
      register_lean: "conversational",
    },
  },
  {
    key: "jester",
    name: "Jester",
    cluster: "Build a Connection",
    word: "Enjoyment",
    voice:
      "Playful, irreverent, energy-forward. Foregrounds having fun and refusing to take the brand too seriously. Self-aware.",
    patterns: [
      "Quick rhythm, short sentences",
      "Self-mockery",
      "Pop-culture or in-joke references",
    ],
    sample:
      "Look. We make socks. We're not going to pretend they're a 'foundational expression of the modern self.' They're socks. They go on your feet. Some of them have flamingos on them because flamingos are objectively the funniest bird. That's the entire pitch.",
    maps_to: {
      identity_descriptors: ["playful", "self-aware", "energy-forward"],
      traits: ["irreverent", "fast-paced", "warm"],
      register_lean: "conversational",
    },
  },
  {
    key: "lover",
    name: "Lover",
    cluster: "Build a Connection",
    word: "Intimacy",
    voice:
      "Sensory, intimate, present-tense. Foregrounds experience and feeling. Comfortable with description and sensory detail.",
    patterns: [
      "Sensory language (texture, light, weight, smell)",
      "Present tense and second-person",
      "Slower sentence rhythm",
    ],
    sample:
      "The cotton is heavy in the hand — not because it's stiff, but because there's enough of it. You hold the shirt up and the weave catches the light differently on each side. It's the kind of garment that doesn't introduce itself. You wear it for a year and then notice how much of your year it's been in.",
    samples: {
      pt:
        "O algodão tem peso na mão — não por ser rígido, mas por haver algodão que chegue. Pega na camisa contra a luz e o tecido apanha a luz de forma diferente de cada lado. É o tipo de peça que não se apresenta. Veste-a durante um ano e só depois nota o quanto desse ano ela esteve consigo.",
    },
    maps_to: {
      identity_descriptors: ["sensory", "intimate", "considered"],
      traits: ["slow-rhythm", "descriptive", "present"],
      register_lean: "considered",
    },
  },
  {
    key: "hero",
    name: "Hero",
    cluster: "Leave a Mark",
    word: "Mastery",
    voice:
      "Driven, performance-oriented, results-led. Foregrounds achievement and the work it took. Active voice.",
    patterns: [
      "Active verbs, opening clauses",
      "Outcomes named with numbers",
      "Past-tense proof, future-tense ambition",
    ],
    sample:
      "We doubled production capacity in 18 months without adding a single overhead role. We did it by ripping out three legacy processes and rebuilding the manufacturing line around one operating principle: every minute of motion has to earn its keep. The next 18 months: we'll do it again.",
    samples: {
      pt:
        "Duplicámos a capacidade de produção em 18 meses sem acrescentar uma única função de estrutura. Fizemo-lo a tirar três processos legados e a reconstruir a linha em torno de um princípio operacional: cada minuto de movimento tem de justificar-se. Nos próximos 18 meses: voltamos a fazê-lo.",
    },
    maps_to: {
      identity_descriptors: ["performance-driven", "outcome-led", "active"],
      traits: ["direct", "declarative", "energetic"],
      register_lean: "considered",
    },
  },
  {
    key: "outlaw",
    name: "Outlaw",
    cluster: "Leave a Mark",
    word: "Liberation",
    voice:
      "Defiant, anti-establishment, sharp. Foregrounds what the industry won't say out loud. Comfortable with conflict.",
    patterns: [
      "Names the incumbent",
      "Refuses softening",
      "Short sentences with high information density",
    ],
    sample:
      "The big four consultancies sell you a deck. Then they sell you another deck. Then they sell you a transformation programme that's the same deck again. We don't do decks. We do work. If you want a 60-slide deliverable, hire McKinsey. We're not for you.",
    maps_to: {
      identity_descriptors: ["defiant", "industry-critical", "uncompromising"],
      traits: ["sharp", "unhedged", "direct"],
      register_lean: "considered",
    },
  },
  {
    key: "magician",
    name: "Magician",
    cluster: "Leave a Mark",
    word: "Power",
    voice:
      "Transformational, vision-led, slightly mystical. Foregrounds the change a customer goes through. Comfortable with bigger claims.",
    patterns: [
      "Before/after structure",
      "Catalyst metaphors ('the moment when')",
      "Vision-tense ('what becomes possible')",
    ],
    sample:
      "Three months ago, the team was running thirty different SaaS subscriptions and four different definitions of 'customer'. Today, there's one. One source of truth, one operating language, one set of decisions everyone can trace. What changed isn't the tools. What changed is what the company can see.",
    maps_to: {
      identity_descriptors: ["transformational", "vision-led", "catalyst"],
      traits: ["broad-canvas", "shift-oriented", "considered"],
      register_lean: "considered",
    },
  },
];

export const ARCHETYPES_BY_KEY: Record<string, Archetype> = Object.fromEntries(
  ARCHETYPES.map((a) => [a.key, a]),
);

/**
 * Pick a small set of archetypes that pair well for an A/B/C choice
 * (different clusters, distinct voice patterns). Used by the system
 * prompt when Claude needs to present voice options to the user.
 */
export const TRIO_PAIRINGS_FOR_VOICE_PICK: string[][] = [
  // Each trio crosses motivation clusters so the user sees real variety
  ["ruler", "caregiver", "everyman"],
  ["sage", "creative", "jester"],
  ["hero", "lover", "innocent"],
  ["outlaw", "explorer", "magician"],
];

export function archetypeShortRef(): string {
  // A compact reference Claude can hold in its system prompt without
  // bloating the cache. ~1200 tokens.
  return ARCHETYPES.map(
    (a) =>
      `${a.key} (${a.name} · ${a.cluster} · ${a.word}): ${a.voice}`,
  ).join("\n");
}
