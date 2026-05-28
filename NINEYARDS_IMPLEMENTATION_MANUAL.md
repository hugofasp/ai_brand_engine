# ai brand engine — Implementation Manual (PDF source)

> Long-form deployment guide for clients. This is the source content
> that becomes the polished `ai-brand-engine-implementation-manual.pdf`
> attached to every delivery email.
>
> A designer should layout this content as a 12-16 page PDF using
> nineyards' visual identity (black background, inverted CTAs,
> serif headlines, generous whitespace).
>
> Companion to NINEYARDS_BUILD_SPEC.md.

---

# Cover page

[Designer notes: full-bleed black with ai brand engine wordmark centered, plus POWERED BY [nineyards logo] in the lower margin. Below, the document title in serif. Below that, subtitle in lighter weight. Generation date at bottom.]

**Title (serif, large):**
> Implementation Manual

**Subtitle (sans, secondary):**
> Setting up your brand DNA file pack on Claude or ChatGPT

**Footer (caption):**
> Version {{framework_version}} · For {{brand_name}}

---

# Page 1 — Welcome

## What you're holding

This manual covers everything you need to set up your customized brand DNA file pack on Claude (recommended) or ChatGPT (also supported). The setup takes 10-15 minutes once you've decided which platform to use.

We recommend reading this end-to-end before starting. The sections cover:

- What's in your delivery
- Choosing a platform (and why we recommend Claude)
- Setup steps for Claude Projects
- Setup steps for ChatGPT Custom GPT
- Verification and first use
- Daily usage and best practices
- Updates and maintenance
- Support

---

# Page 2 — What's in your delivery

## The package

Three attachments came with your delivery email:

**1. {{brand_slug}}-dna-pack-v{{framework_version}}.zip**

Your customized brand DNA. Contains {{file_count}} numbered text files that together teach an LLM to produce content, reason, and evaluate in your brand's voice.

For mono-lingual brands: 12 files.
For bi-lingual brands: 16 files.
For tri-lingual brands: 20 files.

**2. ai-brand-engine-implementation-manual.pdf**

This document.

**3. ai-brand-engine-quickstart.pdf**

A 3-sheet visual reference for your team. Print and keep nearby.

## In the email body itself

Two blocks of paste-in text:

**Universal Custom Instructions** — paste into Claude Projects' Custom Instructions field, or ChatGPT's Custom GPT Instructions.

**ChatGPT Addendum** — append after the universal text when deploying to ChatGPT.

---

# Page 3 — Choosing a platform

You can deploy on Claude (recommended) or ChatGPT. Both work. Each has trade-offs.

## Claude — recommended for professional use

**Why:**

- Claude Projects loads every uploaded file fully into context, every conversation. Your file pack relies on cross-file references — this matters.
- Claude's instruction-following is consistently tighter for complex multi-rule systems.
- The framework was designed and stress-tested primarily on Claude.

**Requirement:** A paid Claude account — Pro, Team, or Enterprise.

## ChatGPT — supported, with technical considerations

**Why it's secondary:**

- ChatGPT uses retrieval over knowledge files. For larger or many files, only chunks may be retrieved per query.
- GPT models can be more variable in adhering to strict system rules.
- Output reliability on complex analytical work is somewhat lower than Claude.

**Requirement:** ChatGPT Plus, Team, or Enterprise — anything that allows Custom GPTs.

## Our advice

For most use cases, both platforms work. For high-stakes outputs, complex brand systems, or multi-locale operations, prefer Claude. For routine content production by a small team, either is fine.

You can deploy on both if you want — the file pack is the same, only the host platform differs.

---

# Page 4 — Setup on Claude Projects

## Step 1: Sign in to Claude

Go to claude.ai and sign in to your paid account.

## Step 2: Create a new Project

Click the Projects icon in the sidebar. Create a new Project.

**Name the Project after your brand** — e.g., "{{brand_name}}". Use this Project exclusively for brand reasoning work. Don't mix with general chat or other tools.

## Step 3: Upload the file pack

In the Project sidebar, find the "Sources" or "Knowledge" panel. Drag and drop all numbered .txt files from your unzipped pack.

Confirm all files uploaded — you should see {{file_count}} files in the panel.

## Step 4: Paste the Custom Instructions

In the Project's "Custom Instructions" field, paste the Universal Custom Instructions block from the delivery email. The block starts with:

> "You operate as a brand reasoning agent..."

**Paste it exactly as provided. Do not modify, do not add extra text.**

Save.

## Step 5: Verify with system check

Open a new conversation in the Project.

Type:
> `system check`

You should see a structured response confirming:
- Brand name: {{brand_name}}
- System version: {{framework_version}}
- Files loaded count
- Primary locale, secondary locales
- Pillars and segments defined
- Examples per locale
- "Ready"

If you see this, setup is complete. If you see wrong values or missing "Ready", return to Step 3.

---

# Page 5 — Setup on ChatGPT Custom GPT

## Step 1: Sign in to ChatGPT

Go to chatgpt.com. Make sure you're on a paid account that supports Custom GPTs (Plus, Team, or Enterprise).

## Step 2: Create a new Custom GPT

In the sidebar, click "Explore GPTs" then "Create". Or navigate to the GPT Builder.

## Step 3: Upload the file pack

In the GPT Builder's "Knowledge" section, upload all numbered .txt files from your unzipped pack.

## Step 4: Paste the Instructions

In the Instructions field, paste in this order:

1. The Universal Custom Instructions text (from the delivery email)
2. The ChatGPT Addendum (also from the delivery email) — append below the universal text

The combined instructions should be one continuous block.

## Step 5: Set Conversation Starters (optional)

ChatGPT GPTs let you set up to 4 conversation starters. Useful ones:
- "Write a LinkedIn post about [topic]"
- "Should we [proposed strategic action]?"
- "Make this email more professional: [paste]"
- "system check"

## Step 6: Save and publish

Save the GPT. Choose visibility (private to you, shared with your team via link, or public).

## Step 7: Verify with system check

Open a new conversation with the GPT.

Type:
> `system check`

Expected response: same as Claude — brand info, version, file counts, "Ready".

---

# Page 6 — First conversations

## Try these prompts in order

Once setup is verified, try a few prompts to confirm everything works as expected.

**Test 1 — Content generation from scratch**

> "Write a short Instagram post about [a topic relevant to your brand]."

Expected: a caption sized for Instagram (80-150 chars), in your conversational register, free of AI clichés, invoking your brand's pillars.

**Test 2 — Content improvement of a draft**

> "Make this email more professional: [paste any rough draft]"

Expected: an improved version of the draft, applying your brand voice, with a brief note describing the substantive changes.

**Test 3 — Analytical mode (open question)**

> "Why is [a core mechanism of your brand] structurally important?"

Expected: a structured analytical response engaging your brand's pillars, with mechanism-first reasoning.

**Test 4 — Analytical mode (proposal evaluation)**

> "I'm thinking of [a specific strategic action]. Thoughts?"

Expected: a structured evaluation — alignment with your brand DNA, tensions, trade-offs, paths forward.

If all four work as expected, you're live. If any feel off, type `debug` after the response to see how the system resolved your prompt — this usually identifies the issue.

---

# Page 7 — The two modes

Your brand reasoning system operates in two modes automatically.

## Content mode

For deliverables. The system writes finished content sized and shaped for the channel.

Two flavors:
- **Generation from scratch** — you provide a prompt, the system writes new content.
- **Improvement of submitted material** — you include an existing draft, the system uses it as input and produces the brand-aligned version.

You don't flag the difference. Just paste the draft if you have one.

## Analytical mode

For thinking. The system reasons with your brand DNA as substrate.

Two flavors:
- **Open question** — exploratory analysis. "Why is X important?" "How should we think about Y?"
- **Specific proposal** — structured evaluation. "I'm thinking of doing Z." Output structure: where it aligns, where it creates tension, trade-offs, paths forward.

Mode is detected from your prompt. Words like "write", "draft", "make a [channel] post" trigger content mode. Words like "should we", "I'm thinking", "explain", "analyze" trigger analytical mode.

## When both apply

A prompt like "Analyze whether we should expand to Spain, and if yes draft the memo" triggers analytical mode first. After the analysis, the system offers to produce the memo in content mode as a follow-up.

---

# Page 8 — Daily usage patterns

A few patterns your team will use often.

## For marketing and social teams

**Quick post:**
> "Write an Instagram post about [topic]."

**Draft polish:**
> "Polish this: [paste]"
> "Make this more direct: [paste]"

**Variant generation:**
> "Give me three different opening lines for this LinkedIn post: [paste]"

**Sensitive comms:**
> "We need to announce a 3-month delay on [project]. Draft the customer email."
The system detects the sensitive context and applies the accountable structure.

## For leadership

**Defending the thesis:**
> "Make the case for [your core thesis] to a skeptical investor."

**Strategic exploration:**
> "Should we add a [new product line / market / capability]?"

**Proposal evaluation:**
> "I'm thinking of [specific strategic action]. What are the trade-offs?"

**Comparing options:**
> "We could either [option A] or [option B]. Walk me through the considerations."

## For operations

**Internal comms:**
> "Draft an internal note explaining [decision] to the team."

**Onboarding language:**
> "Write a paragraph for new hires explaining what we do."

**Customer support drafting:**
> "Draft a response to this complaint: [paste]"

---

# Page 9 — Commands reference

Four commands trigger specific platform behavior. They work in any conversation.

## `system check`

Verifies the file pack is loaded correctly. Returns brand info, file count, version. Useful at the start of important sessions.

## `debug` (or "why did you write that")

Shows how the system resolved your most recent prompt — mode, locale, context, register, pillars used, anchor example (if any), constraints applied.

Useful when an output feels off — debug usually identifies whether the mode was misdetected, the wrong segment was inferred, or a constraint fired unexpectedly.

## `refresh`

Re-anchors brand rigor mid-conversation. Useful for long threads where drift might have crept in.

After typing `refresh`, the system re-reads the protocol and confirms the active brand. Your next message is treated as a fresh resolution.

## Standard prompts

Everything else. The system reads what you're asking and routes to the right mode automatically.

---

# Page 10 — Conversation hygiene

A few practices that keep the system at its best.

## Start fresh conversations for distinct work

Long conversations accumulate context. Brand discipline can dilute. Each major piece of work — a campaign, a strategic question, a sensitive announcement — deserves its own thread.

## Use `refresh` when you sense drift

If outputs start feeling generic in the middle of a long conversation, type `refresh`. The system re-anchors without losing your work.

## Use `debug` when something looks off

Don't argue with an output. Type `debug` and see how the system got there. Usually the issue is a mode misdetection or an unexpected segment inference, both of which can be resolved by rephrasing.

## Use `system check` at the start of important sessions

A quick verification that everything's loaded properly. 10 seconds of insurance.

## Save important outputs immediately

The system produces content; you save what you use. Don't rely on conversation history to retrieve a specific output — copy-paste into your actual workflow.

---

# Page 11 — What this system isn't

Honest about boundaries.

## It's a drafting and reasoning partner, not a final authority

The system reduces brand inconsistency from a constant problem to an occasional one. It doesn't eliminate the need for human judgment. For:

- Legal communications and contracts
- Regulatory filings or financial disclosures
- High-stakes strategic decisions
- Sensitive personnel communications
- Public crisis responses

...use the system to draft and think. Use a human to commit and send.

## Outputs require review

For routine content (Instagram captions, internal memos, sales emails), outputs are usually ready to ship after a quick scan. For longer or higher-stakes content, treat outputs as first drafts.

## The system doesn't know what it doesn't know

If a topic is outside your brand's documented scope, the system refuses gracefully using the off-domain template. It doesn't invent. But for topics partially within your brand (edge cases, novel scenarios), the system will reason its best — review the reasoning, not just the output.

## Adherence is high but not deterministic

Expect 90-95% on-brand outputs on fresh conversations, drifting toward 80-85% on long ones. The remaining 5-15% are typically minor — a register slightly off, a missing mechanism. Use `refresh` and rephrase when needed.

---

# Page 12 — Updates

Your file pack is versioned. The current version appears in `system check`.

## When you receive an update

Updates arrive by email — same flow as the initial delivery. To install:

1. Replace all numbered .txt files in your Project or Custom GPT
2. Re-paste the Universal Custom Instructions (in case they were updated)
3. Run `system check` to confirm the new version is active
4. Run the test prompts on the included Test Prompts file (`92_TEST_PROMPTS.txt`) to verify behavior

## Compatibility

File packs are designed to work with the Custom Instructions of the same major version. Mixing v1.x files with v2.x instructions will produce drift.

When upgrading, replace both at the same time.

---

# Page 13 — Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| System check shows wrong brand name | Wrong file pack uploaded | Re-upload correct files |
| File count seems low | Some files didn't upload | Re-upload missing files |
| Outputs use AI clichés | Custom Instructions not saved or modified | Re-paste exactly, save |
| Drift on long conversations | Context dilution | Type `refresh` or start fresh thread |
| Analytical questions get content responses | Mode detection misfired | Rephrase with clearer trigger ("analyze", "should we", etc.); or type `refresh` and try again |
| Off-brand outputs on ChatGPT | RAG retrieved partial files | Consider Claude for higher-stakes work, or simplify prompts |
| System breaks character | GPT default personality leakage | Re-paste ChatGPT addendum, save |
| Wrong language output | Locale detection misfired | Explicitly state target language: "Write this in Portuguese" |
| Files won't upload | File size or count limit | Check platform's current limits; contact info@nineyards.pt |

## If none of the above helps

Reply to your delivery email or contact info@nineyards.pt. Include:
- What you were trying to do
- The exact prompt you used
- The output you received (or the error)
- A screenshot if helpful

We respond within a working day.

---

# Page 14 — Support and updates

## Direct support

Email: **info@nineyards.pt**

We respond within a working day during the beta period. For complex issues or implementation help, we can schedule a 15-30 minute call.

## Update notifications

When the framework updates, we email all clients who have received a file pack. Updates are opt-in — you choose when (and whether) to apply them.

## Feedback

We're actively refining the platform with our first cohort of clients. Feedback is welcome and useful. Tell us:
- What's working well
- What's frustrating
- What you wish existed
- Outputs that surprised you (good or bad)

Reply to your delivery email or send to info@nineyards.pt.

---

# Page 15 — Quick reference

## At a glance

**Your brand:** {{brand_name}}
**Framework version:** {{framework_version}}
**Locales supported:** {{locales}}
**Recommended platform:** Claude Projects
**Setup time:** 10-15 minutes
**Support email:** info@nineyards.pt

## The four commands

| Command | When |
|---|---|
| `system check` | Start of important sessions |
| `debug` | When an output feels off |
| `refresh` | Mid-conversation drift |
| (no command) | Everything else — just ask |

## The two modes

| Mode | Triggered by | Output |
|---|---|---|
| Content | "write", "draft", "make a [channel]", channel names | Finished content sized for channel |
| Analytical | "should we", "why", "I'm thinking of", "explain" | Structured reasoning |

## The five workflows

| Workflow | Example prompt |
|---|---|
| Write new content | "Write an Instagram post about [topic]" |
| Improve a draft | "Polish this email: [paste]" |
| Think through a question | "Why is [mechanism] important?" |
| Evaluate a proposal | "I'm thinking of [specific action]. Thoughts?" |
| Defend the thesis | "Make the case for [position]" |

---

# Back cover

[Designer note: full-bleed black. Top half: `ai brand engine` wordmark large, centered. Below the wordmark: tagline. Bottom of page: "POWERED BY [nineyards logo]" treatment with link, then copyright row.]

> ai brand engine
> Brand systems for the LLM era

> POWERED BY [nineyards logo]
> nineyards.pt · info@nineyards.pt

> © {{year}} ai brand engine · a nineyards product · Made in Portugal

---

End of Implementation Manual source.
