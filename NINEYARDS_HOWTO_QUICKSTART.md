# ai brand engine — How-to-Use Quickstart (3-sheet PDF source)

> A visual 3-sheet quickstart designed for clients to print and keep
> near their workstations. Three sheets, three jobs:
>
> Sheet 1 — Setup (one-time, do this once)
> Sheet 2 — Daily usage (what your team does every day)
> Sheet 3 — Commands and troubleshooting (the reference card)
>
> Designer notes throughout describe the visual treatment expected.
> Designer should use nineyards' visual identity: black background,
> inverted CTAs, serif headlines, generous whitespace, dense but
> not crowded information.

---

# Sheet 1 — Setup

[Designer notes: Full-bleed black A4 (or US Letter) portrait orientation. Top quarter: nineyards logo + sheet title. Middle: a numbered visual flow (1→2→3→4→5→6) showing setup steps as icon-led blocks. Bottom: small verification box.]

## Header zone

**Wordmark (top-left, ~24mm tall):** `ai brand engine` set in Fraunces, lowercase, white
**Watermark (top-right, smaller):** POWERED BY [nineyards logo]

**Sheet title (serif, prominent):**
> Setup

**Sheet sub-title (sans, secondary):**
> One-time setup for your brand DNA file pack
> Sheet 1 of 3

## Setup flow (visual)

A 6-step numbered visual sequence. Each step is a card with: number, icon, short headline, 1-2 sentence description.

### 1 — Choose your platform

[Icon: split screen, Claude logo and ChatGPT logo]

We recommend Claude. ChatGPT works with caveats. Pick one.

### 2 — Open the platform

[Icon: browser window]

Claude: create a new Project at claude.ai
ChatGPT: create a new Custom GPT at chatgpt.com

### 3 — Upload your files

[Icon: stack of documents being uploaded]

Drag and drop all numbered .txt files from your zip.
You should see 12-20 files depending on locale support.

### 4 — Paste the instructions

[Icon: clipboard with text]

Open the Custom Instructions / Instructions field.
Paste the Universal Custom Instructions from your delivery email.
ChatGPT only: append the ChatGPT addendum after.

### 5 — Save

[Icon: floppy disk or checkmark]

Save the Project / Custom GPT settings.

### 6 — Verify

[Icon: magnifying glass or check]

Start a new conversation. Type `system check`.
You should see your brand name and "Ready".

## Verification panel

[Designer note: white-bordered box at bottom of sheet]

**If system check shows "Ready" — you're live.**

**If you see wrong values or no "Ready":**
- Confirm all files uploaded (count matches your zip)
- Confirm Custom Instructions were saved
- Re-paste the Custom Instructions exactly
- Email info@nineyards.pt if stuck

## Footer

**Right side:** Sheet 1 of 3 — Setup

**Bottom-right caption:** © ai brand engine · For [brand_name] · POWERED BY [nineyards logo]

---

# Sheet 2 — Daily Usage

[Designer notes: Same A4/Letter portrait, dark background. Top zone: header + sub-title. Body: two columns — left column shows CONTENT MODE patterns, right shows ANALYTICAL MODE. Use clear visual separation. Sample prompts shown in mono font (JetBrains Mono) with white.]

## Header zone

**Sheet title:**
> Daily Usage

**Sheet sub-title:**
> Two modes, your team uses both
> Sheet 2 of 3

## Two-column layout

### Left column — CONTENT MODE

[Heading in serif, larger]

**For deliverables. The system writes finished content.**

**Pattern A — Write from scratch:**
[mono font]
> "Write an Instagram post about our new community."
> "Draft an email to qualified leads about our pricing change."
> "Make a LinkedIn post about our integration approach."

**Pattern B — Improve a draft:**
[mono font]
> "Make my email more professional: [paste]"
> "Polish this for Instagram: [paste]"
> "Rewrite this caption: [paste]"

You don't flag whether you're starting fresh or improving — just paste the draft if you have one. The system reads what you've sent.

**Sensitive situations** (delays, complaints, price changes):
The system detects sensitive context automatically and applies the accountable structure (acknowledge → cause → action → timeline).

---

### Right column — ANALYTICAL MODE

[Heading in serif, larger]

**For thinking. The system reasons with your brand DNA.**

**Pattern C — Ask a question:**
[mono font]
> "Why is [our mechanism] structurally important?"
> "Should we expand to a new market?"
> "How should we think about pricing for new clients?"

**Pattern D — Float a proposal:**
[mono font]
> "I'm thinking of [specific action]. Thoughts?"
> "What if we offered customization tiers?"
> "Is it worth doing X to address Y?"

For proposals, the system returns a structured evaluation:
- Where this aligns with your brand
- Where this creates tension
- Trade-offs to consider
- Paths forward (pursue or maintain)

**Defending the thesis:**
[mono font]
> "Make the case for [your core position] to a skeptical investor."

## Bottom strip

[Designer note: full-width white-bordered box]

**You don't choose modes. The system reads your prompt and routes accordingly.**

| You wrote… | The system does… |
|---|---|
| "Write…" / "Draft…" / channel names | Content mode |
| "Should we…" / "Why…" / "I'm thinking…" | Analytical mode |
| (a pasted draft) | Content mode, improvement |
| (a pasted proposal description) | Analytical mode, proposal |

## Footer

**Right side:** Sheet 2 of 3 — Daily usage

---

# Sheet 3 — Commands & Troubleshooting

[Designer notes: Same A4/Letter portrait. Top zone: header. Body split: top half is COMMANDS as a clean reference table; bottom half is TROUBLESHOOTING as a problem→cause→fix table.]

## Header zone

**Sheet title:**
> Commands & Troubleshooting

**Sheet sub-title:**
> The reference card
> Sheet 3 of 3

## Section: Commands

[Heading in serif]

Four commands trigger specific behavior. Type them as a regular message.

### Commands table

[Designer: clean two-column layout, command in mono, description in sans]

| Command | What it does |
|---|---|
| **`system check`** | Verifies files are loaded. Shows brand name, version, file count, ready confirmation. Use at the start of important sessions. |
| **`debug`** | After any output, shows how the system resolved your prompt: mode, locale, context, register, pillars used. Use when an output feels off. |
| **`why did you write that`** | Same as `debug`. Sometimes more natural to type. |
| **`refresh`** | Mid-conversation re-anchor. Use when outputs start feeling generic over a long thread. Doesn't lose your conversation. |

[Designer note: each command in its own row with subtle white border]

## Section: Conversation hygiene

**Three habits that keep the system at its best:**

1. **Start fresh conversations for distinct work.** Long threads dilute brand discipline.
2. **Use `refresh` when drift appears.** Quicker than restarting.
3. **Use `debug` instead of arguing with outputs.** Find the cause, then rephrase.

## Section: Troubleshooting

[Heading in serif]

### Troubleshooting table

| Symptom | Cause | Fix |
|---|---|---|
| System check shows wrong brand | Wrong files uploaded | Re-upload the correct files from your zip |
| File count seems low | Some files didn't upload | Re-upload the missing files |
| Outputs use AI clichés ("innovative", "transform") | Custom Instructions not saved | Re-paste exactly from email, save |
| Drift on long conversations | Context dilution | Type `refresh` or start a new thread |
| Proposal questions get content responses | Mode misdetected | Use clearer analytical trigger ("should we", "I'm thinking"); type `refresh` |
| Generic outputs on ChatGPT | Partial file retrieval (RAG) | Consider Claude for higher-stakes work |
| System refers to itself as AI / ChatGPT | GPT personality leakage | Re-paste ChatGPT addendum |
| Wrong-language output | Locale misdetected | Explicitly request: "Write this in Portuguese" |

## Section: When the system isn't enough

[Compact section, lower right]

**Use the system to draft and think. Use human judgment to commit and send for:**

- Legal communications
- Regulatory filings
- High-stakes strategic decisions
- Sensitive personnel matters
- Public crisis responses

## Footer

**Bottom strip:** [white-bordered, full-width]

**Need help?** Email info@nineyards.pt. We respond within a working day.

**Right side:** Sheet 3 of 3 — Reference

---

# Design specifications for the PDF

## Format

- A4 portrait (210mm × 297mm) — primary
- US Letter alternate (8.5" × 11") — for US-distributed versions
- Print-ready: 300 DPI, CMYK
- Web preview: 144 DPI, RGB

## Color usage

- Background: `#0A0A0A` near-black
- Card backgrounds: `#141414` slightly lighter
- Borders: `#262626` subtle
- Text primary: `#FAFAF7` warm off-white
- Text secondary: `#B8B8B0`
- Text muted (captions, footnotes): `#6B6B66`
- Accent: none. Icons, borders, key callouts use pure white `#FFFFFF` or muted gray `#4A4A4A` for attribution elements

## Typography

- **Display (sheet titles):** Fraunces, weight 400, ~32-40pt
- **Headings (section titles):** Fraunces, weight 400, ~20-24pt
- **Sub-titles:** Inter, weight 500, ~14pt
- **Body:** Inter, weight 400, ~10-11pt, line-height 1.5
- **Mono (commands, prompts):** JetBrains Mono, weight 400, ~10-11pt
- **Caption:** Inter, weight 500, ~8pt, uppercase, letter-spacing 0.02em

## Spacing and layout

- Page margins: 18-22mm
- Column gutters (2-column layouts): 12-16mm
- Block spacing: ~12-16mm between major sections
- Card padding: 8-12mm

## Icons

Use minimalist line icons in pure white `#FFFFFF`, 1.5pt stroke, ~24-32mm tall. Sources: Lucide, Feather, or custom — should feel editorial, not playful. Examples:

- Setup: numbered circles
- Platform: browser window
- Upload: arrow up + document
- Instructions: clipboard
- Save: checkmark or floppy
- Verify: magnifying glass

## Layout sketches (rough proportions)

### Sheet 1 — Setup

```
┌─────────────────────────────────┐
│ Logo            Sheet title     │  ← Header zone (~50mm)
│                 Sub-title       │
├─────────────────────────────────┤
│                                 │
│  ① Choose      ② Open           │
│  ───────       ──────           │
│                                 │  ← Setup flow
│  ③ Upload      ④ Paste          │     (2x3 grid, ~150mm)
│  ──────        ──────           │
│                                 │
│  ⑤ Save        ⑥ Verify         │
│  ────          ────             │
│                                 │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │  Verification panel         │ │  ← Bottom box (~40mm)
│ │  (white border)         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Sheet 2 — Daily usage

```
┌─────────────────────────────────┐
│ Header zone                     │
├─────────────────────────────────┤
│                │                │
│  CONTENT MODE  │ ANALYTICAL MODE│
│                │                │
│  Pattern A     │  Pattern C     │
│  ───────       │  ───────       │
│  prompt        │  prompt        │
│  example       │  example       │  ← 2-column body
│                │                │
│  Pattern B     │  Pattern D     │
│  ───────       │  ───────       │
│                │                │
├─────────────────────────────────┤
│ Mode routing summary (table)    │
└─────────────────────────────────┘
```

### Sheet 3 — Reference

```
┌─────────────────────────────────┐
│ Header zone                     │
├─────────────────────────────────┤
│ Commands table                  │  ← Top half
│  ───────────                    │
│                                 │
├─────────────────────────────────┤
│ Hygiene habits (3 bullets)      │
├─────────────────────────────────┤
│ Troubleshooting table           │  ← Bottom half
│                                 │
├─────────────────────────────────┤
│ When system isn't enough        │
│ Contact info                    │
└─────────────────────────────────┘
```

---

# Versioning

The quickstart is versioned. The current version is shown in the bottom-right caption.

When the framework updates and command set changes, the quickstart should be re-issued. Clients receive the updated PDF as part of any major update.

Version format: `v{framework_version}` — e.g., `v1.4.1`.

---

# Source files

This source markdown is the canonical content. A designer (or design system) produces:

- `ai-brand-engine-quickstart.pdf` — the final 3-sheet PDF
- Source files (Figma, InDesign, or similar) maintained separately
- Web-rendered version on `/how-to-use` static page (uses the same content, different layout)

---

End of How-to-Use Quickstart source.
