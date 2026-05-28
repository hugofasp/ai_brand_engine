# ai brand engine — Static Pages Copy

> Full copy for: Landing, Get Started, Choose, Completion,
> How-to-Use, FAQ, Contact, plus footers and microcopy.
>
> Product brand: `ai brand engine` (always lowercase).
> Parent brand: `nineyards` (appears only as logo, in watermark).
>
> Companion to NINEYARDS_BUILD_SPEC.md.

---

# Voice for the platform itself

Everything below speaks in the ai brand engine's voice — distinct from any individual client brand. The platform voice is:

- **Editorial** — sentences have rhythm, claims have weight
- **Mechanism-aware** — the platform talks about mechanisms because that's what it sells
- **Direct** — no marketing fluff, no padding
- **Honest about limits** — acknowledges what the platform doesn't do and where human judgment is still required
- **Premium without being precious** — high-craft, low-noise

Banned in platform copy (same as any nineyards-built brand): innovative, cutting-edge, transform, unlock, reimagine, seamless, journey, leverage, end-to-end, holistic, synergy, foster, fuel, ignite, paradigm shift, game-changer.

---

# Page: Landing (`/`)

## Hero

**Headline:**
> Brand systems that LLMs actually follow.

**Subhead:**
> A guided interview turns your brand into a structured source of truth. Files you upload to Claude or ChatGPT so every output — content, analysis, evaluation — stays on-brand. Built for founders, marketers, and operators who use AI every day.

**Primary CTA:** Get Started

**Below CTA (microcopy):**
> 20-40 minutes. Files delivered by email.

---

## Below the fold — three value cards

### Card 1
**Title:** Mechanism, not marketing
**Body:** The interview pushes you toward structural answers — what your brand does, not what it claims. Every output the file pack produces traces back to a mechanism your team has named.

### Card 2
**Title:** Two operating modes
**Body:** Your team gets content production (write a post, draft an email, polish a draft) and analytical reasoning (defend the thesis, evaluate a proposal, weigh a trade-off) from the same brand DNA.

### Card 3
**Title:** Native multi-locale
**Body:** Operating in two languages? Three? The file pack scales linearly — eight shared files plus four per locale, all written natively. No machine translation.

---

## Footer

**Left:**
> ai brand engine · brand systems for the LLM era

**Right (links):**
- How to use
- FAQ
- Contact

**Secondary right block (below the links):**
> POWERED BY [nineyards logo]
> nineyards.pt ↗

**Microcopy at very bottom:**
> © {{year}} ai brand engine · a nineyards product · Made in Portugal

---

# Page: Get Started (`/start`)

## Above form

**Headline:** Let's start with the basics.

**Subhead (small, secondary):**
> We need a few details before the interview begins. Takes 30 seconds.

## Form labels

- **Company / brand name** · `placeholder: Your company name`
- **Your name** · `placeholder: First and last name`
- **Email** · `placeholder: you@company.com`
- **Your role (optional)** · select: Founder · Marketing · Brand · Operations · Other

## Form footer

**Microcopy below submit:**
> By continuing you agree to receive emails about your request. We don't market to you.

**Submit button:** Continue →

---

# Page: Choose (`/choose`)

## Heading

> What would you like to generate?

## Sub-heading (small):

> Pick a product to begin. You can come back later for the other one.

## Card 1 — Brand Identity for LLMs

**Top strip:** [inverted CTA bar]

**Badge:** BETA

**Title:** Brand Identity for LLMs

**Description:**
> A complete brand DNA file pack that teaches Claude, ChatGPT, or any LLM to produce content, reason, and evaluate proposals in your brand's voice. Interview-driven setup. Native multi-locale support.

**Footer:** ~20-40 min · 12 files delivered

**CTA on hover (implicit):** Click to start

---

## Card 2 — Design Brand Book for LLMs

**Badge:** COMING SOON

**Title:** Design Brand Book for LLMs

**Description:**
> Visual identity, design tokens, and asset rules for AI design tools. Same interview-driven approach, applied to your visual system.

**Toast when clicked:**
> This product isn't available yet. Want to be notified when it ships? Drop us a line at info@nineyards.pt.

---

# Page: Completion (`/complete/[requestId]`)

## Success indicator (subtle visual)

[Small white circle with checkmark — not flashy]

## Heading

> Your interview is in.

## Body

> You'll receive your brand DNA file pack at {{contact_email}} within 5-10 minutes for most requests. During high-volume periods, allow up to 24 hours.

> If it doesn't land — check spam — email info@nineyards.pt and we'll resend.

## "While you wait" section

**Sub-heading:** While you wait

**Bulleted list of what's coming:**
- A zip containing your customized brand DNA file pack
- Implementation Manual PDF (setup for Claude or ChatGPT)
- How-to-Use 3-sheet Quickstart PDF
- Universal Custom Instructions text (paste into Claude or ChatGPT)

**Link:** Read the How-to-Use guide while you wait →

## Footer

> No further action needed. Watch your inbox.

---

# Page: How-to-Use (`/how-to-use`)

This page serves two audiences: people who just submitted and are waiting for the email; people whose team has already received the file pack and need a refresher.

## Heading

> How to use your ai brand engine file pack

## Intro paragraph

> Your file pack is a brand reasoning system you upload to Claude Projects or a ChatGPT Custom GPT. Once installed, your team can use it to produce on-brand content, think through decisions using your brand's logic, and evaluate proposals against your brand DNA — all from the same source of truth.

---

## Section: What you received

> When your file pack arrives by email, you'll have:

**1. A zip file** — contains 12 to 20 .txt files depending on your locale support. These are the brand DNA files Claude (or ChatGPT) reads as authoritative source of truth.

**2. Two PDF guides**
- *Implementation Manual* — the long-form setup instructions. Read this first.
- *How-to-Use Quickstart* — the 3-sheet visual reference your team keeps handy.

**3. Two paste-in text blocks (in the email body)**
- *Universal Custom Instructions* — paste into Claude Projects' Custom Instructions field, or ChatGPT's Custom GPT Instructions.
- *ChatGPT addendum* — append after the universal text when deploying to ChatGPT specifically.

---

## Section: Choosing a platform

**We recommend Claude.** Reasons:
- Claude Projects loads every uploaded file fully into context, every conversation. The file pack relies on cross-file references — this matters.
- Claude's instruction-following tends to be tighter for complex multi-rule systems.
- The framework was designed and stress-tested primarily on Claude.

**ChatGPT works**, with caveats:
- ChatGPT uses retrieval over knowledge files. For larger or many files, only chunks may be retrieved per query.
- GPT models can be more variable in adhering to strict system rules.
- Output reliability on complex analytical work is somewhat lower.

For routine content and most analytical work, both platforms are fine. For high-stakes outputs or multi-locale brands, prefer Claude.

---

## Section: Setup — Claude Projects

1. Sign in to claude.ai
2. Create a new Project (named after your brand). Use this Project exclusively for brand reasoning — don't mix with general chat.
3. Upload all numbered .txt files from your zip to the Project's sources panel.
4. Open the Project's Custom Instructions field.
5. Paste the Universal Custom Instructions text (from the delivery email) — exactly as provided. Don't modify.
6. Save.
7. Start a new conversation. Type: `system check`
8. You should see: brand name, system version, files loaded, ready confirmation.
9. Run a few test prompts to verify behavior.

If system check shows wrong values or no "Ready" confirmation, return to step 3.

---

## Section: Setup — ChatGPT Custom GPT

1. Go to chatgpt.com (paid account required: Plus or Team)
2. Create a new Custom GPT
3. In the Knowledge section, upload all numbered .txt files from your zip
4. In the Instructions field, paste in this order:
   - The Universal Custom Instructions text
   - The ChatGPT addendum (appended below)
5. Save the GPT (private or shared — your choice)
6. Start a conversation. Type: `system check`
7. Verify the response. Run a few test prompts.

---

## Section: The two modes

Your brand reasoning system detects mode automatically from each prompt.

**Content mode** — for deliverables.

Includes:
- Generating new content: "Write an Instagram post about our new community."
- Improving drafts: "Make this email more professional: [paste draft]"

You don't need to flag that you're submitting a draft. Just paste it. The system uses it as starting material and produces the brand-aligned version.

**Analytical mode** — for thinking and evaluation.

Includes:
- Open questions: "Should we expand to Spain?" "Why is vertical integration cheaper?"
- Evaluating specific proposals: "I'm thinking of doing custom concrete builds for high-end clients."

For specific proposals, the system produces a structured trade-off analysis: where it aligns with your brand, where it creates tension, trade-offs to consider, paths forward.

You don't specify mode — the system reads what you're asking and routes accordingly.

---

## Section: Daily usage patterns

**Writing from scratch.**
> "Write a LinkedIn post about our standardization approach."
New content produced per channel and segment defaults.

**Improving a draft.**
> "Make my email to this qualified lead more professional. Here's what I have: [paste]"
System uses your draft as starting material. Returns the corrected version with a brief note on the substantive changes.

**Quick polish.**
> "Polish this caption: [paste]"
Light-touch edits only. Preserves voice and substance.

**Thinking through a decision.**
> "Should we add a community management role across all our developments?"
Open analytical question. Returns structured reasoning using your brand pillars as lenses.

**Evaluating a specific idea.**
> "I'm considering offering customization tiers — pick from 4 finishes and 3 palettes. Thoughts?"
Specific proposal evaluation. Returns: alignment / tension / trade-offs / if you pursue / if you maintain current system.

**Defending the thesis.**
> "Make the case for our integrated approach to a skeptical investor."
Analytical mode, INVESTOR context. Mechanism-first defense.

In all cases, you don't think about modes. You just ask. The system figures out the right response shape.

---

## Section: Commands

| Command | What it does |
|---|---|
| `system check` | Verify the files are loaded; shows brand info and version |
| `debug` | After any output, shows how the system resolved your prompt (mode, locale, pillars used, etc.) |
| `why did you write that` | Same as debug |
| `refresh` | Re-anchors brand rigor mid-conversation (use when drift creeps in over long threads) |

---

## Section: Conversation hygiene

A few practices that keep the system working at its best:

**Start fresh conversations for distinct work.** Long conversations accumulate context that can dilute brand discipline. Each major piece of work deserves its own thread.

**Use `refresh` when drift appears.** If outputs start feeling generic in the middle of a long conversation, type `refresh`. The system re-anchors without losing your work.

**Use `debug` when something looks off.** Diagnoses most unexpected outputs.

**Use `system check` at the start of important sessions.** Quick verification.

---

## Section: When the system isn't enough

The file pack is a brand-grounded drafting and reasoning partner — not a final authority. For some scenarios, human review remains essential:

- Legal communications and contracts
- Regulatory filings or financial disclosures
- High-stakes strategic decisions (use the system to reason; commit through your usual governance)
- Sensitive personnel communications
- Public crisis responses

Use the system to think and draft. Use human judgment to commit and send.

---

## Section: Updates

Your file pack is versioned. When you receive an update:

1. Replace all numbered files in your Project or Custom GPT
2. Re-paste the Universal Custom Instructions (in case they were updated)
3. Type `system check` to confirm the new version is active
4. Run the test prompts to verify behavior

---

## Section: Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| System check shows wrong brand | Wrong files uploaded | Re-upload correct files |
| File count seems low | Some files didn't upload | Re-upload missing files |
| Outputs use AI clichés | Custom Instructions not saved | Re-paste exactly, save |
| Drift on long conversations | Context dilution | Type `refresh` or start fresh |
| Proposal questions get content responses | Mode detection misfired | Rephrase with clearer analytical trigger; type `refresh` |
| Generic outputs on ChatGPT | RAG retrieved partial files | Consider Claude for higher-stakes work |
| System breaks character occasionally | GPT personality leakage | Re-paste custom instructions including ChatGPT addendum |

---

## Closing

> Questions or issues? Email info@nineyards.pt. We respond within a working day.

---

# Page: FAQ (`/faq`)

## Heading

> Frequently asked questions

## Q&A pairs

### What does ai brand engine actually deliver?

A zipped pack of 12 to 20 text files (depending on locale support) that you upload to Claude Projects or a ChatGPT Custom GPT. Plus two PDF guides for setup and daily use, and a block of paste-in text for the platform's custom instructions field. Together, they make your LLM produce content, reason, and evaluate in your brand's voice.

### Who is this for?

Founders, brand owners, marketing leaders, and operators whose teams use LLMs daily and want consistency. If your team is producing brand-facing content with ChatGPT or Claude and getting inconsistent voice across outputs, this solves that.

### How long does the interview take?

20-40 minutes for mono-lingual brands. 45-90 minutes for multi-locale. The interview is paced — you can save and return. Most brands finish in two or three sessions.

### What's the difference between the two products?

**Brand Identity for LLMs** (currently available, BETA) — a brand reasoning file pack for textual outputs: content, analysis, proposal evaluation. This is what most brands need first.

**Design Brand Book for LLMs** (coming soon) — extends the system to visual identity: design tokens, asset rules, layout patterns. For AI design tools.

### Why are some of the files universal and not customized?

Four files (`00_SYSTEM_PROTOCOL`, `01_CONTEXT_INFERENCE`, `90_INDEX`, `92_TEST_PROMPTS`) are framework infrastructure — they define how the system operates and are identical for every brand. Eight files contain your brand's specific content, and these are customized from your interview.

### Why does multi-locale double or triple the file count?

Voice, lexicon, channel specs, and examples can't be translated — they must be natively written in each language. So we ship four locale-specific files per language, while sharing the framework across them.

### Do I need a paid Claude or ChatGPT account?

Yes. Claude Projects requires Claude Pro or Team. ChatGPT Custom GPTs require Plus or Team. We don't sell access to the LLMs — only the file pack that customizes them.

### Can I use the file pack with other AI tools?

The files are plain text. They're optimized for Claude Projects (best) and ChatGPT Custom GPTs (works with caveats). Other tools may work — the file pack itself doesn't depend on any specific provider — but we test against Claude and ChatGPT only.

### What if my brand changes? Do I need to redo everything?

No. The files are editable — your team can update them directly when something changes. For larger updates (new pillar, new locale), we can regenerate the affected files via the platform.

### Is my interview data private?

Yes. Your interview answers are stored in our database, accessible only to admins (Hugo). We don't share, sell, or repurpose your data. Files generated for you are accessible only to your account and the admin team.

### How much does it cost?

During beta, it's free. We're using this period to refine the platform and the file pack with friendly testers. Pricing will be set after beta — we'll let beta users know before any paid model launches.

### What happens if I get my files and they're wrong?

Reply to the delivery email. Hugo reviews and either revises the files or schedules a brief call to understand what's off. The first cohort of clients is hand-touched — quality matters more than volume right now.

### Can my whole team use the file pack?

Yes. The file pack lives in a Claude Project or Custom GPT, which can be shared with team members. Each team member's conversations are independent but draw from the same source of truth.

### Why isn't this a SaaS subscription with a dashboard?

The file pack is the product — once you have it, you own it and use it inside Claude or ChatGPT. We're not in the loop after delivery. If you'd like ongoing updates, support, or evolution of the file pack, that's a future service offering.

### What if Claude or ChatGPT changes how they handle knowledge files?

If a provider changes behavior that affects the file pack, we'll update the framework and notify beta users. For paid clients (post-beta), updates will be part of the offering.

---

# Page: Contact (`/contact`)

## Heading

> Contact

## Body

> Questions, feedback, or interest in updates? Reach out below or email info@nineyards.pt directly.

## Contact form

**Fields:**
- Name (required)
- Email (required)
- Subject (required) — select: General question · Beta access · Partnership · Feedback · Other
- Message (required, textarea)

**Submit button:** Send

**On submit:** form sends email to info@nineyards.pt, shows toast "Message sent. We respond within a working day.", clears form.

## Direct contact

**Sub-heading:** Direct

**Email:** info@nineyards.pt

**Microcopy:** We're a small team. Most replies come from Hugo, who built this.

---

# Footer (shared across all pages)

**Left column:**
> ai brand engine
> Brand systems for the LLM era.

**Center column (links):**
- How to use
- FAQ
- Contact

**Right column (secondary attribution block):**
> POWERED BY [nineyards logo]
> nineyards.pt ↗ (external link to parent brand site)

**Bottom row:**
> © {{year}} ai brand engine · a nineyards product · Made in Portugal

---

# Microcopy library

For consistent voice across the app, here's a reference of common UI strings:

| Context | Copy |
|---|---|
| Loading spinner | "Loading..." |
| Save indicator (saving) | "Saving..." |
| Save indicator (saved) | "Saved" |
| Save indicator (failed) | "Save failed. Retrying..." |
| Form error (required) | "This field is required." |
| Form error (email invalid) | "Enter a valid email address." |
| Form error (max length) | "Limit: {{max}} characters." |
| Blocklist warning | "This phrase reads as AI-default. Consider revising." |
| Submit button (default) | "Continue →" |
| Back button | "← Back" |
| Phase intro CTA | "Begin Phase {{n}}" |
| End of phase CTA | "Continue to Phase {{n+1}}" |
| Final submit | "Submit" |
| Skip optional | "Skip this question" |
| Tooltip help | "?" or "More info" |
| Modal close | "Close" |
| Toast — generic success | "Done." |
| Toast — generic error | "Something went wrong. Try again or contact info@nineyards.pt." |
| Empty state — admin requests | "No requests yet." |
| Empty state — files | "No files generated yet." |
| Empty state — emails | "No emails sent yet." |

---

# 404 page

**Heading:** Lost the thread.

**Body:** The page you're looking for doesn't exist. Maybe try one of these:

- Home →
- How to use →
- Contact →

---

# 500 / Error page

**Heading:** Something broke.

**Body:** This is on us. We've been notified. Try again in a moment, or if it keeps happening, email info@nineyards.pt with what you were doing.

---

End of static pages copy.
