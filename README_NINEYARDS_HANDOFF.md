# ai brand engine — Build Handoff README

> Start here. This is the entry-point document for the ai brand engine
> build. Below is the full set of handoff documents, what each
> contains, and which to read for which work.

---

## What you're building

**Product name:** ai brand engine (lowercase, always)
**Parent brand:** nineyards (agency) — appears as persistent "POWERED BY [nineyards logo]" watermark across the product
**Hosted at:** `aibrandengine.nineyards.pt`
**Primary admin:** Hugo, via `info@nineyards.pt`

ai brand engine is a self-serve interview platform that captures a brand's foundational information and delivers a generated set of LLM source files (the "brand DNA file pack"). Brand owners upload these files to Claude Projects or ChatGPT Custom GPTs to give their AI tools a single source of truth for brand voice, reasoning, and evaluation.

**Brand hierarchy on the product itself:**
- `ai brand engine` is the headline brand (wordmark in nav, page titles, OG image, PDF covers)
- `nineyards` appears only as the logo in the "POWERED BY" watermark — the text "nineyards" is not written next to the logo; the logo carries the wordmark
- Color system is strict monochrome (pure black, pure white, grays — no chromatic accent)
- Typography: Fraunces (serif display) + Inter (sans body) + JetBrains Mono

**Beta scope:** Only the "Brand Identity for LLMs" product is active; "Design Brand Book for LLMs" shown as "coming soon"
**Volume expectation:** Low-volume, high-touch in beta; manual file generation by admin for the first cohort

---

## The eleven handoff documents

### Read first (always)

**`NINEYARDS_BUILD_SPEC.md`** — Master spec.
The overall product, tech stack, route map, data models, integrations, edge cases, implementation phases, asset checklist, open decisions. Read this end-to-end before starting.

---

### Read for specific work

**`NINEYARDS_INTERVIEW_FULL.md`** — The interview content.
All 7 phases of the interview with every question, validation, structure, tags, orientative language. Required for building the interview engine (Phase 2 of implementation).

**`NINEYARDS_FILE_TEMPLATES.md`** — File generation templates.
The 12 brand DNA file templates with placeholder syntax. Shows how interview answers map to generated file content. Required for building the file generation system (Phase 4 of implementation).

**`NINEYARDS_SYNTHESIS_LAYER.md`** — The LLM-mediated quality layer (architecture).
Critical. Sits between raw interview answers and final file content. Uses Claude API to enforce framework rules (mechanism-first, no AI clichés, structural language) at generation time. Without this layer, generated files have correct structure but variable content quality. Required for production quality.

**`NINEYARDS_FIELD_SYNTHESIS_MAP.md`** — Per-field synthesis specifications (implementation recipe).
The concrete mapping that makes the synthesis layer buildable. For every interview field, specifies: tags, synthesis behavior (direct/light/full/none), exact synthesis prompt structure, validation rules, file template placeholder. This is what closes the loop between interview capture and file generation — without it, the synthesis layer is theory. Required alongside `NINEYARDS_SYNTHESIS_LAYER.md` for implementation.

**`NINEYARDS_FRAMEWORK_FILES.md`** — Static framework file content.
The canonical content of `00_SYSTEM_PROTOCOL.txt`, `01_CONTEXT_INFERENCE.txt`, and `92_TEST_PROMPTS.txt` — these are universal across all clients (not generated from interview). Copy verbatim into every file pack. Required for the file generation pipeline.

**`NINEYARDS_PASTE_IN_TEXTS.md`** — Universal Custom Instructions + ChatGPT addendum.
The two static text blocks delivered in every client's email body. Same text for every brand. Required for the delivery email template.

**`NINEYARDS_PLATFORM_CONSTANTS.md`** — Universal blocklists, channel defaults, register rules, reference brands.
Platform infrastructure data used by file generation and the synthesis layer. Stored as JSON config files in the repo. Required during file generation.

**`NINEYARDS_EMAIL_TEMPLATES.md`** — Email templates (full copy).
Five email types: internal notification, client confirmation, client delivery, reminder, contact form. Each with subject, body, attachments, variables, plain-text fallback. Built with React Email. Required for the email integration (Phase 4 of implementation).

**`NINEYARDS_STATIC_PAGES.md`** — Static page copy.
Full copy for landing, get-started, choose, completion, how-to-use, FAQ, contact, footers, and microcopy library. Required for static page rendering (Phase 1 and 5 of implementation).

**`NINEYARDS_IMPLEMENTATION_MANUAL.md`** — Client-facing PDF source.
Source content for the `nineyards-implementation-manual.pdf` attached to every delivery email. ~15 pages. Needs visual design pass to become the final PDF. Required as a static deliverable before launch.

**`NINEYARDS_HOWTO_QUICKSTART.md`** — 3-sheet quickstart PDF source.
Source content for the `nineyards-how-to-use-quickstart.pdf` attached to every delivery email. 3 sheets. Needs visual design pass to become the final PDF. Required as a static deliverable before launch.

---

## Reading order by role

### For an engineer starting implementation

1. `README_NINEYARDS_HANDOFF.md` (this file)
2. `NINEYARDS_BUILD_SPEC.md` — full spec
3. `NINEYARDS_STATIC_PAGES.md` — copy you need for Phase 1
4. `NINEYARDS_INTERVIEW_FULL.md` — when building Phase 2
5. `NINEYARDS_FILE_TEMPLATES.md` + `NINEYARDS_FRAMEWORK_FILES.md` + `NINEYARDS_PLATFORM_CONSTANTS.md` — when building Phase 4
6. `NINEYARDS_SYNTHESIS_LAYER.md` + `NINEYARDS_FIELD_SYNTHESIS_MAP.md` — when building the synthesis layer (between Phases 3 and 4, or after MVP). Architecture in the former, per-field specs in the latter.
7. `NINEYARDS_EMAIL_TEMPLATES.md` + `NINEYARDS_PASTE_IN_TEXTS.md` — when building Phase 4 (email/delivery)
8. `NINEYARDS_IMPLEMENTATION_MANUAL.md` + `NINEYARDS_HOWTO_QUICKSTART.md` — for the designer to author the static PDFs

### For a designer creating the visual assets

1. `NINEYARDS_BUILD_SPEC.md` (Design System section)
2. `NINEYARDS_STATIC_PAGES.md` — page copy and microcopy
3. `NINEYARDS_IMPLEMENTATION_MANUAL.md` — PDF source for layout
4. `NINEYARDS_HOWTO_QUICKSTART.md` — 3-sheet PDF source for layout

### For Hugo reviewing before approval

1. `README_NINEYARDS_HANDOFF.md` (this file)
2. `NINEYARDS_BUILD_SPEC.md` (sections: User Journey, Implementation Phases, Open Decisions, Assets Needed)
3. `NINEYARDS_STATIC_PAGES.md` (the copy that represents nineyards publicly)
4. `NINEYARDS_INTERVIEW_FULL.md` (sample-check Phase 1 questions for tone)

---

## Implementation order summary

From `NINEYARDS_BUILD_SPEC.md` Section 13 — Implementation Phases:

**Phase 1 (Week 1-2):** Foundation
Next.js setup, Tailwind+shadcn themed, Supabase schema, Resend setup, landing pages, get-started form, choose page, static pages scaffolded.

**Phase 2 (Week 3-4):** Interview engine
All question types, auto-save, resume, phase transitions, summary cards, completion page, reminder email cron.

**Phase 3 (Week 5):** Admin panel
Admin auth, dashboard, request detail with three tabs, inline editing, internal notes.

**Phase 4 (Week 6):** File generation + delivery
Template engine, blocklist validator, file workflow, bundle creation, send-to-client flow, Resend webhook.

**Phase 5 (Week 7):** Polish
Animations, responsive QA, accessibility audit, performance tuning.

**Phase 6 (Week 8):** Soft launch
Internal testing, 2-3 friendly clients, iterate, production deploy.

**Total: 6-8 weeks** of focused engineering.

The synthesis layer (in `NINEYARDS_SYNTHESIS_LAYER.md`) can be built in parallel with Phase 4 or rolled in after MVP. For beta, manual admin review can substitute initially.

---

## Open decisions (from build spec)

Hugo needs to confirm before or during Phase 1:

1. Subdomain (e.g., `aibrandengine.nineyards.pt`)
2. Accent color (decided: strict monochrome, no chromatic accent)
3. Display serif (proposed: Fraunces)
4. Resend "from" display name ("nineyards" vs "Hugo at nineyards")
5. Pricing model post-beta (doesn't affect implementation, but worth deciding before launch)
6. Admin users (just Hugo, or more?)
7. Soft launch list (which 2-3 friendly clients?)

---

## File checklist for handoff

To verify everything is in place:

- [x] `README_NINEYARDS_HANDOFF.md` (this file)
- [x] `NINEYARDS_BUILD_SPEC.md`
- [x] `NINEYARDS_INTERVIEW_FULL.md`
- [x] `NINEYARDS_FILE_TEMPLATES.md`
- [x] `NINEYARDS_SYNTHESIS_LAYER.md`
- [x] `NINEYARDS_FIELD_SYNTHESIS_MAP.md`
- [x] `NINEYARDS_FRAMEWORK_FILES.md`
- [x] `NINEYARDS_PASTE_IN_TEXTS.md`
- [x] `NINEYARDS_PLATFORM_CONSTANTS.md`
- [x] `NINEYARDS_EMAIL_TEMPLATES.md`
- [x] `NINEYARDS_STATIC_PAGES.md`
- [x] `NINEYARDS_IMPLEMENTATION_MANUAL.md`
- [x] `NINEYARDS_HOWTO_QUICKSTART.md`

Plus assets Hugo will provide separately:
- [x] nineyards logo SVG (black version)
- [x] nineyards logo SVG (white/black combo)
- [ ] Favicon (16, 32, 48, 192, 512)
- [ ] OG image (1200x630)
- [ ] Implementation Manual PDF (designer pass on the .md source)
- [ ] How-to-Use Quickstart PDF (designer pass on the .md source)
- [ ] DNS access for nineyards.pt
- [ ] Supabase project
- [ ] Vercel team access

---

## What's the framework version this is built around

All deliverables reference framework version **1.4.1** (the final polished version from the brand DNA framework work). The platform should record this version in `generated_files.framework_version` on every generated file.

When the framework updates (e.g., to 1.5.0), the platform's `/templates/files/static/` directory updates with new versions. Past requests are not auto-updated — clients opt into updates manually.

---

## Contact for the build

Hugo · `info@nineyards.pt`

---

## A note on quality

The most consequential piece of this platform is **content quality of generated files**. Two structural levers ensure quality:

1. **Interview validation** — the interview itself pushes brand owners toward mechanism-first answers via in-prompt guidance, blocklist scans, and competitor-test validations.

2. **Synthesis layer** (`NINEYARDS_SYNTHESIS_LAYER.md`) — between interview submission and file generation, a Claude API call mediates between raw answers and framework-compliant content. This is what turns sloppy user answers into polished file content. **Build this — it's the difference between a platform that ships variable quality and one that ships consistent quality.**

The synthesis layer is optional for beta (Hugo can manually review/refine answers in the admin panel for the first cohort) but it's the architectural element that makes this scale. Prioritize building it before the first paying client.

---

End of handoff README.
