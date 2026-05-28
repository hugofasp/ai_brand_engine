# ai brand engine — Build Spec v1.0

> **Product:** ai brand engine — a self-serve interview platform that
> captures a brand's foundational information and delivers a generated
> set of LLM source files (the "brand DNA file pack").
>
> **Parent / sponsor:** nineyards (agency). Persistent "Powered by
> [nineyards logo]" watermark across the product.
>
> **Hosted at:** `aibrandengine.nineyards.pt`
>
> This document is the single source of truth for the build. Read it
> end-to-end before starting implementation.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [The Product (What the Platform Delivers)](#2-the-product)
3. [User Journey](#3-user-journey)
4. [Tech Stack](#4-tech-stack)
5. [Design System](#5-design-system)
6. [Routes & Page Specs](#6-routes--page-specs)
7. [Interview Content](#7-interview-content)
8. [Data Models](#8-data-models)
9. [Integrations](#9-integrations)
10. [Email Templates](#10-email-templates)
11. [Admin Panel Detail](#11-admin-panel-detail)
12. [Edge Cases & Accessibility](#12-edge-cases--accessibility)
13. [Implementation Phases](#13-implementation-phases)
14. [Assets Needed](#14-assets-needed)
15. [Open Decisions](#15-open-decisions)

---

## 1. Project Overview

**Product:** ai brand engine
**Parent brand:** nineyards (agency, nineyards.pt). Persistent attribution via "Powered by [nineyards logo]" watermark.
**Owner / primary admin:** Hugo, contactable at `info@nineyards.pt`
**What it does:** A self-serve interview platform that converts a guided interview into a 12-file LLM source pack tailored to each client's brand.

**Brand hierarchy:**
- ai brand engine = headline brand on the product itself (wordmark, page titles, OG image, PDF covers)
- nineyards = persistent watermark in every page header, every email footer, every PDF back cover
- The product is always referred to as "ai brand engine" in lowercase
- The nineyards mark is the logo (no need to also write the word "nineyards" beside it — the logo carries the wordmark)

**Why this exists:** Brands and companies are using LLMs (Claude, ChatGPT, etc.) across all client touchpoints — social media, blog posts, sales emails, customer comms — but they don't have a unified source of truth for how the brand should talk, reason, and evaluate. Every LLM session produces slightly different brand voice. ai brand engine solves this by producing a structured file pack that any brand can upload to Claude Projects or ChatGPT Custom GPTs to enforce a single source of truth.

**Who the user is:**
- **Primary:** Brand owners, founders, and marketing leaders who use LLMs heavily and need consistency
- **Secondary:** Their staff — once installed, the platform's output is used daily by marketing teams, communications staff, and leadership for content production, analysis, and proposal evaluation

**Beta scope (v1):** Only the "Brand Identity for LLMs" product is active. A second product, "Design Brand Book for LLMs," is shown as "coming soon" — visible but blocked.

**Volume expectation:** Low-volume, high-touch in beta. Hugo manually reviews each request, polishes generated files, and sends the final pack. This is intentional — automation comes after the first cohort has been served.

---

## 2. The Product

The platform delivers a brand DNA file pack with this structure (framework version 1.4.1, all `.txt` files):

**Locale-agnostic files (8):**
- `00_SYSTEM_PROTOCOL.txt` — runtime contract
- `01_CONTEXT_INFERENCE.txt` — prompt-resolution rules
- `10_BRAND_CORE.txt` — entity, thesis, value chain, positioning
- `11_AUDIENCE.txt` — mechanism-based audience segments
- `12_PILLARS.txt` — brand pillars with decision rules
- `20_VOICE_CORE.txt` — voice rules + universal AI-default blocklist
- `90_INDEX.txt` — version manifest + maintenance checklist
- `92_TEST_PROMPTS.txt` — regression suite

**Locale-specific files (4 per supported locale):**
- `21_VOICE_FLEX_[LOCALE].txt` — register samples
- `22_LEXICON_[LOCALE].txt` — native blocklist + signature phrases
- `30_CHANNEL_SPECS_[LOCALE].txt` — channel format rules
- `31_EXAMPLES_LIBRARY_[LOCALE].txt` — worked examples

**File counts:** Mono-lingual brand = 12 files. Bi-lingual = 16. Tri-lingual = 20.

**Plus delivered separately:**
- Universal Custom Instructions (paste-in text for Claude Projects)
- ChatGPT-specific addendum (additional paste-in for Custom GPTs)
- Implementation Manual (PDF — long-form deployment guide)
- How-to-Use 3-sheet visual quickstart (PDF)

The platform's job is to capture the interview answers, generate the files, and deliver the package.

---

## 3. User Journey

Numbered steps from landing to delivery:

1. User lands on the homepage → clicks "Get Started"
2. User fills a short form: company name, contact name, email, optional role → submits
3. User sees two product cards:
   - **Brand Identity for LLMs** (BETA, active)
   - **Design Brand Book for LLMs** (BLOCKED, "Coming Soon")
4. User clicks the active card → begins the guided interview
5. Interview runs through 7 phases (Foundation, Audience, Pillars, Voice, Lexicon, Channel Specs, Examples) — typically 20–40 minutes
6. User completes interview → sees completion screen explaining the email is coming within 5–10 minutes (allow up to 24h for high volume; check spam; contact `info@nineyards.pt` if missing)
7. **Internal:** `info@nineyards.pt` receives a notification email about the new submission
8. **Manual admin process (v1):** Hugo opens the request in the admin panel, reviews interview answers, generates the file pack (downloads templates pre-filled with answers, polishes locally, uploads finalized versions), then clicks "Send to client"
9. Client receives a delivery email with the file pack zipped + Implementation Manual + How-to-Use PDF attached

For v2, file generation becomes automated. For v1, every step beyond submission is human-touched.

---

## 4. Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Server actions, edge runtime for forms |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | Customized with design tokens below |
| UI primitives | shadcn/ui | Components are copied in and themed, not a package dep |
| Auth | Supabase Auth | Admin-only login (clients don't authenticate) |
| Database | Supabase Postgres | With Row Level Security |
| Storage | Supabase Storage | Generated files, manuals, logos |
| Email | Resend | Transactional emails + delivery tracking webhook |
| Forms | React Hook Form + Zod | Per-step validation |
| Hosting | Vercel | Auto-deploys from `main`; preview deploys from PRs |
| Analytics | Vercel Analytics | Basic in v1 |
| Fonts | Google Fonts | Fraunces (serif) + Inter (sans) + JetBrains Mono |
| Icons | Lucide React | Lightweight, consistent |

**Required environment variables:**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server-only, for admin operations
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://aibrandengine.nineyards.pt
ADMIN_NOTIFICATION_EMAIL=info@nineyards.pt
```

---

## 5. Design System

The visual language inherits from the nineyards mark: black, white, serif-anchored, editorial. High contrast. Minimal color. Typography does the heavy lifting.

### 5.1 Color tokens

```css
/* Backgrounds — pure black */
--color-bg-primary: #000000;          /* True black, app background */
--color-bg-secondary: #0E0E0E;        /* Cards, raised surfaces */
--color-bg-tertiary: #1A1A1A;         /* Input bg, hover surfaces */

/* Text — pure white + grays */
--color-text-primary: #FFFFFF;        /* True white */
--color-text-secondary: #B8B8B8;      /* Secondary text, labels */
--color-text-muted: #6E6E6E;          /* Placeholder, captions */
--color-text-attribution: #4A4A4A;    /* Watermark, "Powered by" */

/* Borders */
--color-border-subtle: #1F1F1F;       /* Card borders, dividers */
--color-border-strong: #3A3A3A;       /* Input borders */
--color-border-emphasis: #FFFFFF;     /* Focus rings, active CTAs */

/* Interactive states — inversion + opacity, NO chromatic accent */
--color-cta-bg: #FFFFFF;              /* Primary CTA = inverted */
--color-cta-text: #000000;
--color-cta-hover-opacity: 0.9;
--color-cta-active-opacity: 0.8;

/* State communication — achromatic, via icon + microcopy */
/* No success/error/warning colors. Use icons (lucide-react Check,
   AlertTriangle) + microcopy to communicate state. */
```

**Strict monochrome.** The system has no chromatic accent. All visual hierarchy comes from contrast, opacity, type weight, and inversion. CTAs invert (white bg, black text). Error/success states communicate via icons + microcopy, not color. This produces the editorial-precise feel that matches nineyards' brand identity.

Tailwind config extends these as named colors. All hardcoded hex usage in components is banned — always reference tokens.

### 5.2 Typography

**Font families:**
- **Display (serif):** Fraunces (Google Fonts) — variable serif that echoes the logo
- **Body (sans):** Inter (Google Fonts) — neutral, legible
- **Mono:** JetBrains Mono — for file names, version strings

**Type scale:**

| Token | Family | Size | Weight | Line height | Letter spacing |
|---|---|---|---|---|---|
| `display-xl` | Serif | 64px | 400 | 1.1 | -0.02em |
| `display-lg` | Serif | 48px | 400 | 1.15 | -0.015em |
| `display-md` | Serif | 36px | 400 | 1.2 | -0.01em |
| `display-sm` | Serif | 28px | 400 | 1.25 | 0 |
| `heading-lg` | Sans | 24px | 500 | 1.3 | -0.005em |
| `heading-md` | Sans | 20px | 500 | 1.35 | 0 |
| `heading-sm` | Sans | 16px | 500 | 1.4 | 0 |
| `body-lg` | Sans | 18px | 400 | 1.6 | 0 |
| `body-md` | Sans | 16px | 400 | 1.6 | 0 |
| `body-sm` | Sans | 14px | 400 | 1.55 | 0.005em |
| `caption` | Sans | 12px | 500 | 1.4 | 0.02em (uppercase) |
| `mono` | Mono | 14px | 400 | 1.5 | 0 |

**Responsive scaling:** display sizes step down one level at mobile breakpoint (`<768px`).

### 5.3 Spacing scale (4px base)

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
--space-4xl: 96px;
```

### 5.4 Borders & radii

```css
--radius-sm: 4px;     /* Inputs, badges */
--radius-md: 8px;     /* Buttons, cards */
--radius-lg: 12px;    /* Modals, large surfaces */
--radius-pill: 999px; /* Pills, tags */
--border-thin: 1px;
--border-medium: 2px; /* Focus rings */
```

### 5.5 Motion

```css
--motion-fast: 150ms;
--motion-base: 250ms;
--motion-slow: 400ms;
--motion-easing-out: cubic-bezier(0.16, 1, 0.3, 1);
--motion-easing-in: cubic-bezier(0.7, 0, 0.84, 0);
```

Respect `prefers-reduced-motion` — disable non-essential animations.

### 5.6 Shadows

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
--shadow-md: 0 4px 12px rgba(0,0,0,0.5);
--shadow-lg: 0 12px 32px rgba(0,0,0,0.6);
```

### 5.7 Component inventory

#### ai brand engine wordmark

The product's primary brand mark. Used in top nav, OG image, PDF covers, email headers.

```
Text: "ai brand engine"
Font: Fraunces (matching nineyards' serif family)
Case: all-lowercase (mirroring nineyards' lowercase wordmark)
Weight: 400 (regular)
Size at default nav use: 22-26px
Color: var(--color-text-primary)  /* white */
Tracking: -0.01em
```

In nav contexts: clickable link → `/` (returns home).
At smaller sizes (favicon, mobile): can collapse to monogram `abe` in same Fraunces serif.

SVG assets needed in both white and black variants.

#### Powered-by watermark

Persistent attribution to the parent brand. Lives in the top nav, opposite the wordmark.

```
Layout: "POWERED BY [nineyards logo]"
"POWERED BY" — Inter, 10-11px, uppercase, letter-spacing 0.08em
Color: var(--color-text-attribution)  /* #4A4A4A */
nineyards logo — SVG (white version), 14-16px tall
Gap between text and logo: 8-10px
Whole element is a clickable link → https://nineyards.pt (new tab)
Hover: opacity rises 0.6 → 1.0
Mobile collapse: hides "POWERED BY" text below 480px; only the logo remains, still right-aligned
```

Also appears in: footer (every page), email footers, PDF back covers.

#### Button

Variants: `primary` (inverted: white bg, black text), `secondary` (outlined: 1px white border, white text on transparent bg, hover full-inverts), `ghost` (text only, hover opacity rises).
Sizes: `sm` (h-8 / 32px), `md` (h-10 / 40px), `lg` (h-12 / 48px).
States: default, hover (opacity 0.9), active (opacity 0.8), focus (2px white ring, 2px offset), disabled (opacity 0.4), loading (inline spinner, disabled).

There is no `destructive` variant in a chromatic sense — destructive actions use the primary inverted button with `AlertTriangle` icon prefix and accountable microcopy.

Example tailwind for primary md:
```
bg-white text-black hover:opacity-90 active:opacity-80
focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2
focus-visible:ring-offset-bg-primary
h-10 px-6 rounded-md font-medium text-base
transition-opacity duration-fast
disabled:opacity-40 disabled:pointer-events-none
```

#### Input (text, email, textarea)

Background: `bg-tertiary`. Border: `border-thin border-strong`. Focus: border becomes `accent`. Error: border becomes `error` + caption below in error color.

Label above input: `caption` typography, uppercase, `text-secondary`. Required indicator: small white dot (`•`) after label.
Helper text below: `body-sm`, `text-muted`.

#### Card

Standard: `bg-secondary` + `radius-md` + 1px `border-subtle` border + padding `space-lg`. Hover (interactive cards): border lifts to `border-strong`, adds `shadow-md`.

Selection card (used on choose screen): same as standard but with white border (`border-medium`) on selected state.

#### Progress indicator (interview header)

Horizontal bar, 2px tall, full width, position sticky at top. Background `bg-tertiary`, fill `accent`. Above bar: row with phase indicator ("Phase 2 of 7 — Audience") on left, save status on right.

#### Modal

Backdrop: `rgba(0,0,0,0.7)` with backdrop blur. Container: `bg-secondary`, `radius-lg`, max-width 560px, padding `space-2xl`, `shadow-lg`. Close button top-right (16px from edges).

#### Toast

Anchored bottom-right, slide up 250ms `motion-easing-out`. State-colored left border (4px), padded card, auto-dismiss after 5s or on click.

#### Top navigation

Sticky, 72px tall, `bg-primary` with 1px bottom border `border-subtle`.

Layout:
```
┌──────────────────────────────────────────────────────────────┐
│  ai brand engine                       POWERED BY [logo]     │
└──────────────────────────────────────────────────────────────┘
```

- Left: ai brand engine wordmark (clickable → `/`)
- Right: Powered-by watermark (clickable → nineyards.pt)
- Admin nav (when authenticated): rendered between wordmark and watermark, center-or-left-aligned, ghost button styling

On interview pages, the progress bar sits directly below this nav (2px tall, full width).

#### Tabs (admin request detail)

Horizontal tab bar, 1px bottom border, tabs are buttons. Active tab: white text + 2px white underline (animated slide on switch).

#### Table (admin dashboard)

Header row: `bg-secondary`, `caption` typography uppercase, `text-secondary`. Body rows: alternate `bg-primary` / `bg-secondary` is acceptable but prefer single background with subtle hover. Hover: `bg-tertiary`. Cell padding `space-md space-lg`.

#### Status badge

Pill (`radius-pill`), `caption` typography, padded `space-xs space-md`. Color matches status:
- `started` → muted gray
- `interview_complete` → warning amber
- `files_generated` → inverted CTA
- `sent` → success sage
- `failed` → error brick

---

## 6. Routes & Page Specs

```
/                              → Landing
/start                         → Get Started form
/choose                        → Two-option choice
/interview/[requestId]         → Interview (multi-step)
/complete/[requestId]          → Completion message
/how-to-use                    → Static: usage guide
/faq                           → Static: FAQ
/contact                       → Static: contact form
/admin/login                   → Admin login
/admin                         → Admin dashboard
/admin/requests/[id]           → Request detail
```

### 6.1 Landing — `/`

**Purpose:** Communicate the product, drive to Get Started.

**Layout:**
- Full-bleed `bg-primary` (true black) background
- Top nav: `ai brand engine` wordmark left, `POWERED BY [nineyards logo]` watermark right (per the Top navigation component spec)
- Centered content, max-width 720px on desktop, full-width with 24px padding on mobile
- Vertical rhythm: `space-4xl` top, content, `space-4xl` bottom

**Content (top to bottom):**
1. Top nav (as above — persistent across all pages)
2. Hero headline (`display-xl` on desktop, `display-lg` mobile): "Brand systems that LLMs actually follow."
3. Subtitle (`body-lg`, `text-secondary`, max-width 560px): ~140 chars explaining the value prop. Suggested copy: "A guided interview turns your brand into a structured source of truth — files you upload to Claude or ChatGPT so every output stays on-brand. Built for founders, marketers, and operators who use AI daily."
4. Primary CTA button: "Get Started" → `/start` (white bg, black text per inverted-CTA spec)
5. Below the fold: three short value cards (3-column desktop, stacked mobile) — content from `NINEYARDS_STATIC_PAGES.md`
6. Footer: ai brand engine tagline, secondary nineyards attribution, links to FAQ, Contact

**Interactions:**
- CTA hover: opacity 0.9 (no scale or chromatic shift — monochrome discipline)
- Page entry: staggered fade-up 400ms on each major element

### 6.2 Get Started — `/start`

**Purpose:** Capture identity before the interview investment.

**Layout:**
- Centered card max-width 480px
- Card padded `space-2xl`
- Header above card: `display-sm` "Let's start with the basics."

**Form fields (React Hook Form + Zod):**
1. `company_name` — text, required, max 120 chars
2. `contact_name` — text, required, max 100 chars
3. `contact_email` — email, required, validated format
4. `contact_role` — select, optional: "Founder", "Marketing", "Brand", "Operations", "Other"

**Submit (server action):**
1. Validate
2. Insert into `requests` table with status `started`
3. Set HTTP-only cookie `nineyards_request_id` = the new UUID (30-day expiry)
4. Redirect to `/choose`

**Bottom of card:** Microcopy in `text-muted`: "By continuing you agree to receive emails about your request."

### 6.3 Choose — `/choose`

**Purpose:** Present products. One available, one locked.

**Layout:**
- Centered headline (`display-md`): "What would you like to generate?"
- Below: two cards side-by-side on desktop, stacked on mobile
- Each card: full-height, padding `space-2xl`, `radius-md`

**Card 1 — Brand Identity for LLMs (active, BETA):**
- White accent strip at top (8px tall, full width of card)
- Badge top-right: "BETA" (caption, white bg, dark text)
- Icon: SVG, ~48px, stylized document with structured lines
- Title (`heading-lg`): "Brand Identity for LLMs"
- Description (`body-md`, `text-secondary`): ~3 lines explaining what's delivered
- Footer row: "~20 min interview · 12 files delivered"
- Hover: lift translateY(-2px), border becomes white
- Click: → `/interview/[requestId]?product=brand-identity` (read requestId from cookie)

**Card 2 — Design Brand Book for LLMs (blocked):**
- Same shape but opacity 0.5, `cursor-not-allowed`
- Badge top-right: "COMING SOON" (caption, warning bg, dark text)
- No hover lift
- Click: toast "This product isn't available yet. Want to be notified? Drop us a line at info@nineyards.pt"

### 6.4 Interview — `/interview/[requestId]`

**Purpose:** Capture the brand DNA content via 7-phase guided questions.

**Critical:** This is the most complex page. See [Section 7 — Interview Content](#7-interview-content) for the questions themselves.

**State:**
- Server-side: every answer auto-saves on input blur via server action, writing to `interview_answers.answers` JSONB
- Client-side: React Hook Form manages current step's local state
- Resume: visiting the URL with valid request_id cookie restores last incomplete step

**Layout (three regions):**

**Header (sticky):**
- Top row: nineyards logo (left), save status indicator (right) — shows "Saved" briefly after blur, otherwise hidden
- Progress bar (2px tall, full width)
- Below progress bar: `caption` row — left: "Phase X of 7 — [Phase Name]" — right: "Question Y of Z"

**Body (centered, max-width 720px):**

Question card structure (varies by question type):
1. Sub-caption: question ID and intra-phase position
2. Question (`display-sm`): the actual question
3. "Why this matters" callout (`body-md`, `text-secondary`, italic): explains the system reason
4. Orientative box (subtle `bg-secondary` panel, `radius-md`, padding `space-lg`): the brand-owner guidance — pushes toward mechanism-first answers
5. Input area: type varies (see question types below)
6. Inline validation feedback

**Footer (sticky):**
- "Back" ghost button (left), disabled on first question of first phase
- "Next" primary button (right), label changes to "Continue to next phase" on last question of phase, "Submit" on final question
- Mobile: footer becomes fixed at bottom, full-width buttons

**Phase intro card (shown when entering each new phase):**
- Full-screen takeover
- `display-md` "Phase 3 of 7 — Pillars"
- Paragraph explaining what this phase covers
- Primary button "Begin Phase 3"

**End-of-phase summary card:**
- Lists all answers captured in this phase
- Each editable inline
- Primary button "Continue to Phase 4" + secondary "Review again"

**Question types to support:**

| Type | Component | Used in |
|---|---|---|
| Short text | Single-line text input | Brand name, segment name |
| Long text | Textarea with character counter (max 500 or 2000 depending) | Problem statements, descriptions |
| Multi-field group | Multiple inputs under one question | Entity definition (6 fields) |
| List input | Add/remove items with reordering | Causes, pillars, differentiators |
| Per-locale input | One input per supported locale | Short definitions, triggers |
| Multi-select chips | Tag-style selection | Channel triggers |
| Slider 0–5 | With marked steps | Pillar context weights |
| Slider -2 to +2 | With marked steps and zero anchor | Segment modifiers |
| Pair input | Bad/Good comparison | Banned-term examples |

Auto-save runs on blur for each input. After 2 seconds of inactivity, also save in background. Failed saves queue locally with retry.

**Final submission:**
1. POST to `/api/interview/submit` (server action)
2. Update `requests.status = 'interview_complete'`, set `interview_completed_at = now()`
3. Trigger internal notification email via Resend
4. Redirect to `/complete/[requestId]`

### 6.5 Completion — `/complete/[requestId]`

**Purpose:** Reassure user, set expectations.

**Layout:**
- Centered, max-width 560px
- Top: subtle success indicator (small filled circle in white, with checkmark inside — not flashy)
- Headline (`display-md`): "Your interview is in."
- Body paragraphs:
  - "You'll receive your brand DNA file pack at [contact_email] within 5–10 minutes for most requests. During high-volume periods, allow up to 24 hours."
  - "If it doesn't land (check spam), email us at info@nineyards.pt and we'll resend."
- Sub-section: "While you wait:" with bullets listing what to expect and link to `/how-to-use`
- No CTA — this is a terminal page

### 6.6 Admin login — `/admin/login`

Standard Supabase Auth flow. Centered card, max-width 400px. Email + password OR magic link. Logo at top, "Admin sign in" headline.

### 6.7 Admin dashboard — `/admin`

**Purpose:** Hugo sees all requests, filters, takes action.

**Header:** nineyards logo, "Admin" caption, profile menu (sign out, settings).

**Filter bar:**
- Status filter (multi-select chips): Started, Interview Complete, Files Generated, Sent, Failed
- Date range picker
- Search: by email or company

**Table:**

| Column | Content | Sortable |
|---|---|---|
| Submitted | Date, formatted | Yes (default desc) |
| Company | Company name | Yes |
| Contact | Name + email mailto link | No |
| Product | Product chosen | No |
| Status | Badge | Yes |
| Last activity | Relative time ("2h ago") | Yes |
| Actions | "Open" button | No |

- Click row → navigates to detail
- Hover: bg becomes `bg-tertiary`
- Empty state: when no requests, show illustration + "No requests yet."

### 6.8 Admin request detail — `/admin/requests/[id]`

**Purpose:** Hugo reviews, generates files, sends to client.

**Header (sticky):**
- Breadcrumb: "Admin / Requests / [Company name]"
- Status badge
- Right side: action buttons (status-dependent)
  - If `interview_complete`: "Mark as in-progress", "Generate files"
  - If `files_generated`: "Send to client"
  - Always available: "Mark as failed", "Add note"

**Sub-header card:**
- Company, contact name, email (clickable), role
- Submitted timestamp, last activity
- Internal notes (Hugo's private notes — editable inline)

**Tabs:**

#### Tab: Answers

Grouped by phase. Each question shows:
- Phase / question caption
- Question text (read-only)
- The user's raw answer
- The structured-template version (file-ready format, see Section 7 for templates)
- Tags from the interview (e.g., `mechanism_test`, `per_locale`)
- "Edit" pencil icon — opens inline editor (so Hugo can fix a banned cliché the user slipped in)

At the bottom of this tab:
- "Copy all answers as JSON" — exports the full response for external processing
- "Validate answers" — runs the universal blocklist against text answers, highlights any cliché hits

#### Tab: Files

A list of files the system should generate:

```
00_SYSTEM_PROTOCOL.txt        [universal, framework-provided]    [Download template]
01_CONTEXT_INFERENCE.txt      [universal, framework-provided]    [Download template]
10_BRAND_CORE.txt             [filled from answers]              [Generate]
11_AUDIENCE.txt               [filled from answers]              [Generate]
12_PILLARS.txt                [filled from answers]              [Generate]
20_VOICE_CORE.txt             [partial fill from answers]        [Generate]
21_VOICE_FLEX_EN.txt          [filled per locale]                [Generate]
22_LEXICON_EN.txt             [filled per locale]                [Generate]
30_CHANNEL_SPECS_EN.txt       [filled per locale]                [Generate]
31_EXAMPLES_LIBRARY_EN.txt    [filled per locale]                [Generate]
90_INDEX.txt                  [universal, framework-provided]    [Download]
92_TEST_PROMPTS.txt           [partial fill from answers]        [Generate]
```

Each row shows file status:
- **Not generated** — gray badge
- **Generated** — white badge, "Download" + "Upload finalized" buttons
- **Finalized** — sage badge, "Download" button

"Generate" creates the file from a server-side template using the request's answers, substitutes values, and stores in Supabase Storage at `requests/[id]/files/[filename]`.

The universal/framework-provided files (00, 01, 90 etc.) are stored once in the platform's `framework-templates` bucket and copied per request.

After generating, Hugo can:
1. Download to polish locally
2. Re-upload the finalized version (overwrites the stored file)
3. Mark file as finalized

When all required files are finalized, the "Send to client" action becomes enabled.

Also in this tab — "Static deliverables to attach":
- Implementation Manual PDF — link to platform's master copy
- How-to-Use 3-sheet PDF — link to platform's master copy
- Universal Custom Instructions (Claude) — text block, copy button
- ChatGPT addendum — text block, copy button

These don't change per client — they're constants of the platform.

#### Tab: Email

- Email type selector: "Delivery email" / "Resend" / "Follow-up"
- Subject line input (default: `Your [company_name] DNA file pack from nineyards`)
- Body textarea with default template loaded
- Attachments list: shows all finalized files + manuals (auto-collected from Files tab)
- "Preview" button — renders the email as it will appear
- "Send to client" primary button — calls Resend API, updates `requests.status = 'sent'`, logs to `email_log`

After send: shows delivery status from Resend webhook (delivered, opened, clicked, bounced).

### 6.9 Static pages

#### `/how-to-use`

Long-form article, max-width 720px, generous typography. Content based on the deployment guide from the framework. Sections:
- What you received
- Choosing a platform (Claude vs ChatGPT)
- Setup for Claude Projects
- Setup for ChatGPT Custom GPT
- The two modes
- Daily usage patterns
- Commands reference
- Troubleshooting

#### `/faq`

10–15 question/answer pairs. Accordion components.

#### `/contact`

- Contact info (email link)
- Optional contact form: name, email, subject, message → submits to Resend, also stored as a `email_log` entry of type `contact_form`

---

## 7. Interview Content

The interview drives the platform's whole value. Seven phases, each producing content for specific files. Phases 1–3 are detailed in full below. Phases 4–7 are outlined here and can be elaborated in implementation.

### Phase 1 — Foundation (populates `10_BRAND_CORE`)

#### Q1.1 — Brand name and locale

- **Question:** "What's the brand called, and in which language(s) does it operate?"
- **Why it matters:** Anchors every other answer; drives file naming.
- **Answer structure:**
  - `brand_name` (text)
  - `locale_primary` (ISO 639-1 select)
  - `locale_secondary` (ISO 639-1 multi-select, optional)
- **Orientative:** "Add additional languages only if you'll actually create content in them. Each extra locale doubles roughly four files of work."
- **Tags:** `[foundation] [locale_config] [mandatory]`
- **Validation:** Required. Locales must be valid ISO 639-1 codes.

#### Q1.2 — Channel-locale defaults (optional)

- **Question:** "Do any of your channels always operate in a specific language, regardless of who's writing?"
- **Why it matters:** Without this, the system infers locale from prompt language, which can be wrong for brands with stable per-channel patterns.
- **Answer structure:** Per channel (INSTAGRAM, LINKEDIN, EMAIL, INVESTOR_MEMO, TECHNICAL_DOC, WEB_HERO, PRESS_RELEASE, INTERNAL_MEMO): "follows prompt" OR specific locale code
- **Orientative:** "If you don't have hard rules, leave them as 'follows prompt'."
- **Tags:** `[foundation] [locale_config] [optional]`

#### Q1.3 — Entity definition

- **Question:** "Describe what your brand actually is, structurally. Not marketing language — operational truth."
- **Sub-fields:** name, type, structure, focus, region, specialization
- **Orientative:** "Avoid 'we're a leader in...' or 'we specialize in delivering...'. Aim for the kind of definition you'd put in a regulatory filing."
- **Tags:** `[foundation] [entity] [mandatory]`
- **Validation:** Reject answers containing forbidden phrases like "leader in", "specializes in", "innovative", "cutting-edge". Push back with: "That sounds aspirational. What does the company *do* in concrete terms?"

#### Q1.4 — Thesis: problem

- **Question:** "What problem does your brand exist to solve, and what specifically causes that problem?"
- **Answer structure:** `problem` (single sentence) + `causes` (list, 3–5 items, each a specific mechanism)
- **Orientative:** "We want the *mechanisms*. Not 'housing is expensive' but 'housing is expensive because production is fragmented, design is non-standardized, and intermediary margins stack.'"
- **Tags:** `[foundation] [thesis] [mandatory] [mechanism_test]`
- **Validation:** Each cause must be mechanistic — a thing that happens, not a state of being.

#### Q1.5 — Thesis: resolution

- **Question:** "How does your brand resolve that problem? What's the specific approach?"
- **Answer structure:** Single sentence or short phrase
- **Orientative:** "A 3-word formula works ('Industrialize + Integrate + Standardize'). A vague aspiration doesn't."
- **Tags:** `[foundation] [thesis] [mandatory] [mechanism_test]`

#### Q1.6 — Value chain

- **Question:** "Walk through your value chain. Stages from input to delivery, then the cumulative effect."
- **Answer structure:** `stages` (ordered list) + `effects` (list)
- **Orientative:** "Each stage is something concrete that happens. Each effect should be measurable or observable."
- **Tags:** `[foundation] [value_chain] [mandatory]`

#### Q1.7 — Positioning

- **Question:** "What category do you operate in? What axes matter?"
- **Answer structure:** `category` (text) + `axes` (list)
- **Tags:** `[foundation] [positioning] [mandatory]`

#### Q1.8 — Differentiation

- **Question:** "List 3–5 specific things your brand does that competitors structurally cannot."
- **Answer structure:** List
- **Orientative:** "If a competitor could write the same sentence about themselves, drop it."
- **Tags:** `[foundation] [differentiation] [mandatory] [competitor_test]`
- **Validation:** Each differentiator should fail the "could any competitor say this?" test.

#### Q1.9 — Negative definition

- **Question:** "What is your brand NOT?"
- **Answer structure:** List of "not a..." statements (3–5)
- **Tags:** `[foundation] [negative_definition] [mandatory] [boundary_check]`

#### Q1.10 — Outcomes

- **Question:** "What 3–5 outcomes does your brand actually produce for customers?"
- **Answer structure:** List
- **Tags:** `[foundation] [outcomes] [mandatory] [mechanism_test]`

#### Q1.11 — Short definition per locale

- **Question:** "Distill the brand into one paragraph. Native in each supported locale."
- **Answer structure:** One textarea per supported locale (50–80 words each)
- **Orientative:** "If you struggle without 'innovative', 'leading', 'comprehensive', or 'cutting-edge', pull from Q1.4–Q1.9."
- **Tags:** `[foundation] [short_definition] [mandatory] [per_locale] [no_translation]`
- **Validation:** Run universal blocklist scan; reject if cliché terms appear.

### Phase 1 — Output template

```
# 10_BRAND_CORE
Document ID: BRAND_CORE
Version: 1.0
Last updated: [DATE]

## Locale configuration
Primary locale: [Q1.1]
Secondary locales: [Q1.1]

## Channel locale defaults
[Q1.2]

## Entity
Name: [Q1.3]
Type: [Q1.3]
Structure: [Q1.3]
Focus: [Q1.3]
Region: [Q1.3]
Specialization: [Q1.3]

## Thesis
Problem: [Q1.4]
Causes:
[Q1.4 causes list]
Resolution: [Q1.5]

## Value chain
Stages: [Q1.6]
Effect: [Q1.6]

## Positioning
Category: [Q1.7]
Axes: [Q1.7]

## Differentiation
[Q1.8]

## Negative definition
[Q1.9]

## Outcomes
[Q1.10]

## Short definitions
short_definition_[locale]: |
  [Q1.11 per locale]
```

### Phase 2 — Audience (populates `11_AUDIENCE`)

- **Q2.1** — Audience framing (mechanism-based primary insight + consequence)
- **Q2.2** — Primary segment identification
- **Q2.3** — Per segment, capture (looped for each segment):
  - Q2.3.1 — Name + triggers per locale
  - Q2.3.2 — Criteria (structural, financial, life stage)
  - Q2.3.3 — Primary condition
  - Q2.3.4 — Core problem
  - Q2.3.5 — Drivers
  - Q2.3.6 — Non-drivers
  - Q2.3.7 — System fit + why segment matters
- **Q2.4** — Common conditions across segments
- **Q2.5** — Non-targets (3–5 profiles with reasons)
- **Q2.6** — Decision thresholds (access / structure / confidence conditions)

### Phase 3 — Pillars (populates `12_PILLARS`)

- **Q3.1** — Pillar count (4–7 typical) + names per locale
- **Q3.2** — Per pillar (looped):
  - Q3.2.1 — Name + display name per locale + problem
  - Q3.2.2 — Mechanism
  - Q3.2.3 — Decision rule accept_when (2–4 conditions)
  - Q3.2.4 — Decision rule reject_when (2–4 conditions)
  - Q3.2.5 — Effect
  - Q3.2.6 — Context weights (sliders, 0–5 per context: SALES, INVESTOR, TECHNICAL, COMMUNITY, INTERNAL)
  - Q3.2.7 — Segment modifiers (sliders, -2 to +2 per segment)
- **Q3.3** — Contradictions (2–4 tension pairs with resolution rules)
- **Q3.4** — System principle (single sentence)

### Phase 4 — Voice (populates `20_VOICE_CORE` + `21_VOICE_FLEX_[LOCALE]`)

- Voice identity (3–5 descriptors)
- Voice traits (4–6 adjectives)
- Core rule (single irreducible principle)
- Brand-specific forbidden phrases (universal AI defaults are pre-loaded)
- Forbidden formatting (em dashes? exclamation marks?)
- Required formatting (case conventions?)
- **Per locale, per register**: a sample 80–150 word piece in each register (precise, considered, conversational, accountable)
- Sensitive situation playbook (delays, complaints, price changes, closures, refunds — per locale)
- Off-domain response templates per register per locale

### Phase 5 — Lexicon (populates `22_LEXICON_[LOCALE]`)

Per locale:
- Signature phrases (5–15)
- Preferred substitutions (10–20 X-not-Y pairs)
- Punctuation policy
- Brand-specific banned terms (5–20)
- Native AI defaults to block (platform suggests common ones; brand owner confirms/adds)

### Phase 6 — Channel specs (populates `30_CHANNEL_SPECS_[LOCALE]`)

Mostly defaults. Questions only where the brand deviates:
- Channel-specific length adjustments
- Forbidden openers specific to brand
- Cross-channel rules unique to brand
- Locale-specific length adjustments (PT/ES run longer than EN)

### Phase 7 — Examples library (populates `31_EXAMPLES_LIBRARY_[LOCALE]`)

The labor-intensive phase. Per locale, capture finished examples:
- 2–3 per primary channel (Instagram, LinkedIn, Email, Web Hero), both from-scratch and improvement-of-submitted-material
- 2–3 for secondary channels
- 3–5 sensitive situation examples
- 4–6 analytical examples (open question + proposal evaluation, across contexts)

Target: 30–45 examples per locale. Time investment: 5–10 min per example.

### Interview behavior notes

- **Auto-advance:** After answering a question, brief pause (250ms) then animate to next
- **Smart defaults:** Pre-fill based on prior answers where possible (e.g., if user named 3 segments in Q2.2, generate stub questions for each in Q2.3)
- **Skippable phases:** Channel specs (Phase 6) can be skipped if user accepts all defaults — show a "Use defaults" button at the phase intro
- **Save state:** Every blur writes to `interview_answers.answers` JSONB at path `phase_X.q_Y_Z`

---

## 8. Data Models

```sql
-- Note: Supabase Auth manages auth.users table for admins.
-- Clients don't authenticate in v1.

create table requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Client info
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_role text,

  -- Product
  product text not null check (product in ('brand-identity', 'design-brand-book')),

  -- Status flow
  status text not null default 'started' check (status in (
    'started',
    'interview_in_progress',
    'interview_complete',
    'files_generated',
    'sent',
    'failed',
    'abandoned'
  )),

  -- Audit timestamps
  interview_started_at timestamptz,
  interview_completed_at timestamptz,
  files_generated_at timestamptz,
  sent_at timestamptz,

  -- Admin
  admin_notes text,
  assigned_admin uuid references auth.users(id)
);

create index idx_requests_status on requests(status);
create index idx_requests_email on requests(contact_email);
create index idx_requests_created on requests(created_at desc);

-- Interview answers (one row per request)
create table interview_answers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Progress
  current_phase int default 1,
  completed_phases int[] default '{}',

  -- Structured answers
  -- Shape: { phase_1: { q1_1: {...}, q1_2: {...}, ... }, phase_2: {...}, ... }
  answers jsonb default '{}'::jsonb,

  -- Admin post-interview edits (preserved separately for audit)
  admin_edits jsonb default '{}'::jsonb
);

create unique index idx_answers_request on interview_answers(request_id);

-- Generated files
create table generated_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  created_at timestamptz default now(),

  file_name text not null,         -- e.g., "10_BRAND_CORE.txt"
  storage_path text not null,      -- Supabase Storage path
  file_size_bytes int,
  framework_version text not null, -- e.g., "1.4.1"
  locale text,                     -- null for agnostic files, e.g., "en" for 21_VOICE_FLEX_EN.txt

  status text not null default 'generated' check (status in (
    'generated',
    'edited',
    'finalized'
  ))
);

create index idx_files_request on generated_files(request_id);

-- Email log
create table email_log (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  created_at timestamptz default now(),

  recipient text not null,
  subject text not null,
  type text not null check (type in (
    'internal_notification',
    'client_confirmation',
    'client_delivery',
    'contact_form',
    'reminder',
    'resend'
  )),
  resend_message_id text,
  status text default 'sent' check (status in (
    'queued',
    'sent',
    'delivered',
    'opened',
    'clicked',
    'bounced',
    'failed'
  )),
  error text,
  metadata jsonb default '{}'::jsonb
);

create index idx_email_request on email_log(request_id);
create index idx_email_status on email_log(status);

-- Update timestamps trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_requests_updated
  before update on requests
  for each row execute function update_updated_at();

create trigger update_answers_updated
  before update on interview_answers
  for each row execute function update_updated_at();
```

### Row Level Security

```sql
alter table requests enable row level security;
alter table interview_answers enable row level security;
alter table generated_files enable row level security;
alter table email_log enable row level security;

-- Admins can do everything
create policy "Admins full access on requests"
  on requests for all
  using (auth.uid() is not null);

create policy "Admins full access on answers"
  on interview_answers for all
  using (auth.uid() is not null);

create policy "Admins full access on files"
  on generated_files for all
  using (auth.uid() is not null);

create policy "Admins full access on emails"
  on email_log for all
  using (auth.uid() is not null);

-- Clients don't have auth tokens — all client operations go through
-- server actions using the service_role key. RLS doesn't apply there.
```

### Storage buckets

```
framework-templates/       (private, admin-only)
  - templates for the universal files (00, 01, 90, etc.)
  - master copies of Implementation Manual PDF, How-to-Use PDF
  - logos and brand assets

request-files/             (private, admin-only)
  - requests/[id]/files/[filename].txt
  - signed URLs generated on demand for email attachments

public-assets/             (public read)
  - logos for the website
  - favicon, og-image, etc.
```

---

## 9. Integrations

### 9.1 Supabase

**Project setup:**
1. Create new Supabase project
2. Run migrations for the schema above
3. Configure RLS policies
4. Create storage buckets with policies
5. Enable Auth: email/password + magic link

**Auth configuration:**
- Allow sign-ups: disabled (admins are added manually via Supabase dashboard initially)
- Email confirmations: enabled
- Site URL: production app URL
- Redirect URLs: `https://aibrandengine.nineyards.pt/admin`

### 9.2 Resend

**Domain setup:**
- Verify `nineyards.pt` in Resend
- DKIM, SPF, return-path records configured

**Sending addresses:**
- `hello@nineyards.pt` — client-facing emails
- `notifications@nineyards.pt` — internal notifications
- (Optional) `noreply@nineyards.pt` — automated only

**Webhook:**
- Endpoint: `POST /api/webhooks/resend`
- Events to listen for: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`
- Secret stored in `RESEND_WEBHOOK_SECRET`, verified on each request
- Updates `email_log.status` based on event

### 9.3 Server actions structure

```
/app/actions/
  - requests.ts       (create, update, get)
  - interview.ts      (save answer, advance phase, submit)
  - admin.ts          (file generation, email sending)
  - contact.ts        (contact form submission)
```

Use Next.js server actions for all mutations. Use Supabase service-role key on server, anon key on client (read-only).

---

## 10. Email Templates

Build with React Email (https://react.email) for type-safe template composition.

### 10.1 Internal notification (`internal_notification`)

- **To:** `info@nineyards.pt` (from `ADMIN_NOTIFICATION_EMAIL`)
- **From:** `notifications@nineyards.pt`
- **Trigger:** When `requests.status` changes to `interview_complete`
- **Subject:** `[nineyards] New request — [company_name]`
- **Body:** Plain, no marketing styling. Contains:
  - Company name + contact details
  - Product chosen
  - Submitted timestamp
  - Direct link to admin detail: `${NEXT_PUBLIC_APP_URL}/admin/requests/[id]`
  - Brief summary: number of phases completed, locales supported

### 10.2 Client confirmation (`client_confirmation`)

- **To:** `requests.contact_email`
- **From:** `hello@nineyards.pt` (with display name "nineyards" or "Hugo at nineyards" — TBD)
- **Trigger:** Immediately after interview submission, in parallel with internal notification
- **Subject:** `Your nineyards request is in`
- **Body:** Branded, clean. Contains:
  - Greeting using `contact_name`
  - Confirms submission
  - Sets expectations (5–10 min for most, up to 24h, check spam)
  - Brief explanation of what they'll receive
  - Link to `/how-to-use` for what to expect when files arrive
  - nineyards footer

### 10.3 Client delivery (`client_delivery`)

- **To:** `requests.contact_email`
- **From:** `hello@nineyards.pt`
- **Trigger:** Admin clicks "Send to client" in request detail
- **Subject:** `Your [company_name] DNA file pack from nineyards` (editable in admin)
- **Body (editable in admin, default template):**
  - Greeting
  - "Here's your brand reasoning system. Two manuals attached — start with the Implementation Manual to set up Claude or ChatGPT, then keep the How-to-Use sheet handy for your team."
  - List of files attached (file pack zip + 2 manuals)
  - Reminder: Universal Custom Instructions for Claude (text block in email body, copy-pasteable) + ChatGPT addendum (also in email body)
  - Note: "Questions or issues? Reply to this email — it reaches us directly."
  - Footer

**Attachments:**
- `[brand-slug]-dna-pack.zip` — contains all generated files
- `nineyards-implementation-manual.pdf`
- `nineyards-how-to-use.pdf`

Total attachment size budget: 25 MB (Resend limit). PDFs should be compressed appropriately.

### 10.4 Reminder (`reminder`)

- **Trigger:** Cron job (Vercel cron or Supabase scheduled function): when a `requests.status = 'interview_in_progress'` for >24 hours without activity
- **Subject:** `Your nineyards interview is waiting`
- **Body:** Brief, with link to resume
- **One reminder only** — after 7 days mark `status = 'abandoned'`

### 10.5 Contact form (`contact_form`)

- **To:** `info@nineyards.pt`
- **From:** `notifications@nineyards.pt`
- **Trigger:** Contact form submission
- **Subject:** `[nineyards contact] [subject]`
- **Body:** Plain — name, email, subject, message

---

## 11. Admin Panel Detail

### 11.1 File generation logic (server-side)

For each file the platform generates:

```
generateFile(requestId, fileName) {
  1. Load the file template from framework-templates/[fileName]
  2. Load interview answers from interview_answers.answers
  3. Apply admin_edits if present (admin overrides win)
  4. Substitute template placeholders with answer values
     - [BRAND_NAME] → entity.name
     - [Q1.4_PROBLEM] → answers.phase_1.q1_4.problem
     - [Q1.4_CAUSES] → answers.phase_1.q1_4.causes (formatted as bullet list)
     - etc.
  5. Validate the output:
     - Run universal blocklist scan; if hits, flag for admin review
     - Check structural completeness (all required sections populated)
  6. Save to request-files/[requestId]/files/[fileName]
  7. Insert/update generated_files row with status 'generated'
  8. Return signed URL for admin download
}
```

The templates live in `/templates/files/` as `.txt.template` files with placeholder syntax. Each placeholder maps to a path in the answers JSONB.

### 11.2 Bundle creation for email

When admin clicks "Send to client":

```
buildBundle(requestId) {
  1. Verify all required files are in status 'finalized'
  2. Create zip archive containing:
     - All .txt files (the brand DNA pack)
     - README.txt with package summary
  3. Store zip at request-files/[requestId]/bundles/[brand-slug]-dna-pack.zip
  4. Return signed URL for the bundle
}
```

### 11.3 Send-to-client flow

```
sendDeliveryEmail(requestId) {
  1. Build bundle (above)
  2. Compose email from template, with admin's edited subject/body
  3. Attach: bundle zip, Implementation Manual PDF, How-to-Use PDF
  4. Send via Resend
  5. Log to email_log
  6. Update requests.status = 'sent', sent_at = now()
  7. Show admin: delivery status (via webhook updates)
}
```

---

## 12. Edge Cases & Accessibility

### Edge cases

- **Interview abandonment:** Save on every blur. After 24h inactive, send one reminder. After 7 days, mark `abandoned`.
- **Duplicate submissions:** Allowed; admin dashboard groups by `contact_email`.
- **Long text answers:** Hard limit 2000 chars per question, with soft warning at 1500.
- **Email delivery failure:** Resend webhook marks `bounced` or `failed`. Admin notified. Admin can manually retry from detail page.
- **Browser back/forward during interview:** Handled by Next.js routing + auto-save. Restoring state from server on each page load.
- **Multiple tabs same interview:** Last write wins (with timestamp). Show warning if a conflict is detected.
- **Slow connection:** Auto-save queues locally if fetch fails; retries with exponential backoff. Status indicator updates.
- **Server timeout on generation:** File generation runs as background task with status polling, not blocking the admin UI.
- **Invalid file template:** If a template fails to parse, file row gets status `failed`, admin sees error and can re-trigger.

### Accessibility (WCAG 2.1 AA)

- All interactive elements: visible focus indicators (`accent` 2px ring, 2px offset, never outline:none without replacement)
- Form inputs: label associations, `aria-describedby` for help text and errors
- Color contrast: white-on-black comfortably exceeds 4.5:1
- Keyboard navigation: tab order matches visual; Escape closes modals; Enter submits forms when no textarea is focused
- Screen reader announcements: status changes ("Saved" via `aria-live="polite"`), errors via `role="alert"`
- Respect `prefers-reduced-motion`: disable parallax, scale, and non-essential transitions
- Skip-to-content link in top nav
- Language attribute on `<html>` set per user's resolved locale
- Forms: clear error messages, never rely on color alone (icon + text)
- Tables: proper `<thead>` / `<tbody>` semantics, sortable columns announce sort state

---

## 13. Implementation Phases

### Phase 1 — Foundation (Week 1–2)
- Next.js + TypeScript project setup
- Tailwind config with design tokens
- shadcn/ui components copied in and themed
- Supabase project setup, schema, RLS, buckets
- Resend setup, domain verification, basic test email
- Landing page, Get Started form, Choose page
- Base layout + nav + footer
- Static pages scaffolded (How-to-Use, FAQ, Contact)

### Phase 2 — Interview engine (Week 3–4)
- Multi-step form architecture
- All question type components
- Auto-save server action
- Resume from cookie
- Phase transitions and progress indicator
- Phase summary cards
- Completion page
- Reminder email cron

### Phase 3 — Admin panel (Week 5)
- Supabase Auth integration for admins
- Dashboard with filtering, sorting, search
- Request detail with three tabs
- Inline answer editing
- Internal notes

### Phase 4 — File generation + delivery (Week 6)
- Template engine for file generation
- Universal blocklist validator
- File status workflow (generated → edited → finalized)
- Bundle creation
- Send-to-client email flow
- Resend webhook integration

### Phase 5 — Polish (Week 7)
- Animations and micro-interactions
- Responsive QA across all breakpoints
- Accessibility audit and fixes
- Performance tuning (Lighthouse > 90 across the board)
- Loading states, error states, empty states reviewed

### Phase 6 — Soft launch (Week 8)
- Internal testing with mock requests
- 2–3 friendly clients run the full flow
- Iterate on copy and UX
- Production deploy to subdomain

**Total: 6–8 weeks of focused engineering.**

---

## 14. Assets Needed

Hugo will provide:
- [x] nineyards logo SVG (black version) — provided
- [x] nineyards logo SVG (white-and-black version) — provided
- [ ] nineyards favicon (16, 32, 48, 192, 512 — generate from logo)
- [ ] OG image (1200x630) for social link previews
- [ ] Implementation Manual PDF (final, polished version)
- [ ] How-to-Use 3-sheet visual presentation PDF
- [ ] DNS access for `nineyards.pt` to verify Resend + point subdomain
- [ ] Supabase project (or budget for new)
- [ ] Vercel team access (or budget for deployment)
- [ ] Domain decision (see Open Decisions)

Claude Code will generate:
- The Tailwind theme from the design tokens
- All shadcn/ui components themed to spec
- The 7 question-type components
- The admin panel UI
- The three Resend email templates (React Email)
- The static pages (How-to-Use, FAQ, Contact)

---

## 15. Decisions (resolved)

1. **Product name:** `ai brand engine` (lowercase, always)
2. **Parent attribution:** nineyards (agency), "POWERED BY [nineyards logo]" persistent watermark across the product
3. **Subdomain:** `aibrandengine.nineyards.pt` (SEO-optimised, keyword in URL)
4. **Color palette:** strict monochrome — pure black + pure white + grays only. No chromatic accent. State communication via icons + microcopy.
5. **Display serif:** Fraunces (Google Fonts)
6. **Body sans:** Inter (Google Fonts)
7. **Mono:** JetBrains Mono
8. **Wordmark:** "ai brand engine" set in Fraunces, all-lowercase, weight 400, tracking -0.01em
9. **Resend "from" name:** `ai brand engine` (sender display name); parent identity appears as the watermark in the email body
10. **Framework version:** 1.4.1

Items still to confirm with Hugo before launch (do not block engineering):

- **Pricing model post-beta** — one-time, monthly retainer, tiered? (Doesn't affect v1 implementation.)
- **Admin user list** — initially just Hugo. Add others as needed via Supabase dashboard.
- **Soft launch list** — Hugo to nominate 2-3 friendly clients for beta testing.
- **Phases 4-7 of interview content** — fully specified in `NINEYARDS_INTERVIEW_FULL.md`. Build can proceed.
- **Implementation Manual + How-to-Use PDFs** — source content drafted in `NINEYARDS_IMPLEMENTATION_MANUAL.md` and `NINEYARDS_HOWTO_QUICKSTART.md`. Designer pass needed to produce final PDFs.

---

## Reference: Framework version

The brand DNA framework that drives the file pack is at version **1.4.1**. This is the version Claude Code should reference when building file templates. Key concepts the templates need to encode:

- Two operating modes (CONTENT and ANALYTICAL)
- Content mode handles both generation from scratch and improvement of submitted material
- Analytical mode handles both open questions and specific proposal evaluation
- Submitted-material classification (draft brand output vs proposal description)
- Three proposal-evaluation output variants (aligned / contradictory / mixed)
- Universal AI-default blocklist lives in `20_VOICE_CORE` (locale-agnostic)
- Native AI-default blocklists per locale live in `22_LEXICON_[LOCALE]`
- Single source of truth for channel triggers and sensitive triggers in `01_CONTEXT_INFERENCE`

These behaviors are encoded in the framework files Claude Code generates from interview answers. The platform itself doesn't enforce them at runtime — they're properties of the file pack the client uploads to their LLM.

---

**End of build spec. Direct questions to Hugo at info@nineyards.pt.**
