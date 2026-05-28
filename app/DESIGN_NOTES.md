# Design notes — decisions made during the build

Decisions captured beyond what's in `NINEYARDS_BUILD_SPEC.md`.

---

## DN-001 — Draft to force a better interview

**Date:** 2026-05-26
**Status:** **v1 beta SHIPPED** (website-crawl path). v2 path (paid scrapers
for LinkedIn/IG/TikTok) queued as DN-002.

### Context

User feedback during Phase 2 build:
> The interview questions are very big, very specific. We should let users
> upload commercial presentations, brand materials, the website, and
> derive context from those, then ask only what's missing.

### Decision

Add an optional **Phase 0: Materials** pre-step BEFORE the interview begins.
Uploaded materials produce *drafts* per question — never auto-filled into
the answer field. The user still must touch every input to advance.

The interview itself remains intact. Materials reduce typing on
extractable questions; mechanism / reject_when / voice samples / register
questions stay cold-asked because they don't exist in source materials.

### What this is NOT

- It is NOT "extract → confirm" — that ships pitch-deck content laundered
  through the framework's structure. Garbage in, garbage out.
- It is NOT "skip the interview if you upload" — the human still does
  the work; materials just reduce friction on the parts that ARE
  inferrable.

### Implementation sketch

1. **Phase 0 page** (`/interview/[id]/materials`)
   - File upload: pitch deck (PDF), brand guidelines (PDF/DOCX), other
   - URL input: website
   - Supabase Storage bucket: `request-materials/[id]/`
   - DB column: `interview_answers.materials_context jsonb` (extracted text + structured metadata)

2. **Extraction pipeline** (server action triggered after upload)
   - PDF → text (e.g., `pdf-parse` or Anthropic Files API)
   - Website fetch → HTML → main content (e.g., `mozilla/readability` server-side)
   - Claude API call: one prompt per extractable question, returns either
     a draft answer or "not found in materials"
   - Store drafts in `materials_context.drafts[questionId] = { value, source, confidence }`

3. **Question metadata** — add `extractable: boolean` to the Question type.
   - Phase 1: Q1.1, Q1.3 (entity), Q1.7 (category), Q1.10 (outcomes), Q1.11 are extractable.
   - Q1.4 causes, Q1.5 resolution, Q1.6 effects, Q1.8 differentiators (sometimes), Q1.9 negative-def — mechanism-grade — NOT extractable.
   - Phase 2-3 — most NOT extractable (mechanism / reject-when work).
   - Phase 4-5 register samples / lexicon — NOT extractable.

4. **Question renderer affordance** — when a draft exists, show it as a
   *suggestion card* next to the input (not pre-filled). Buttons:
   "Use as starting point" (copies into input, user must edit), "Dismiss".
   Suggestion card carries the source attribution ("From: deck.pdf, p.3").

5. **Synthesis layer integration** (Phase 4 of build) — pass
   `materials_context` to Claude as background context, NOT as direct
   answer source. Use cases: cross-check user answers against source for
   factual errors, pull specific numbers from the deck when the user
   referenced "our growth rate" abstractly.

### Sales angle

Landing CTA upgrade post-launch: "Try it on your brand" with file upload
on the landing page itself. Show a half-filled Phase 1 within 30 seconds
of upload. High-conversion demo moment.

### Sequencing

Build order:
1. Finish Phase 2 of build spec — encode interview Phases 2-7, build
   remaining input types (sliders, structured_list, segment_setup,
   multi_select_chips), wire final submit, reminder cron.
2. **Hugo dogfoods the full interview** on nineyards — that's the
   verification gate for Phase 2.
3. *Then* this DN-001 work lands as a Phase 2.5 / Phase 4-precursor.

Estimated effort: ~3-4 focused days after Phase 2 wraps.

### Open question

Will eventually need a UX call: does the user see drafts question-by-
question (current sketch) or all-at-once in a "review your auto-fills"
page before the interview starts? Question-by-question feels right
because it preserves the orientative discipline of each question, but
worth user-testing.

---

### v1 beta — what shipped

- **Phase 0 page** at `/interview/[id]?phase=0`: Google-style URL input (primary) + paste textarea (secondary, for stealth-mode brands without a website) + skip link. One CTA per path; mutually exclusive.
- **Domain crawler** (`lib/materials/crawl-domain.ts`): fetches entry URL + auto-discovers up to 6 high-signal same-domain pages (About / Services / Work / Methodology / Approach / Team / etc.) using URL-keyword ranking. Junk paths filtered (legal / privacy / blog / cart / etc.). 6-page cap, 60s budget, 200ms polite delay, 12K-char-per-page cap.
- **LinkedIn URL detection** (in crawler): picks up `linkedin.com/company/*` URLs from any crawled page's HTML, stores in `materials_context.linkedin_urls`. **Not consumed by v1 extraction** — kept for v2 paid-scrapers handoff.
- **Loading-as-screen takeover** during extraction. Auto-redirect to Q1.1 when done — no results-summary interstitial.
- **Banner on Q1.1**: dismissable single-line "Read your-domain.com — N drafts ready. You'll write the rest." Failure mode: "We couldn't pull enough signal — answering cold. [Try again]"
- **Drawer pattern**: collapsed-by-default per question. Tag visible always (`Draft from your materials — starting point, not the answer`). Click expands to: (1) draft + source quotes, (2) "This part needs you cold" — missing-context prompts, (3) actions (Start from this draft / Write fresh instead).
- **Extraction prompt** (`lib/materials/extract-drafts.ts`): Sonnet 4.6, structured output via `zodOutputFormat`. Rules cover anti-extrapolation (no inferring "founder-led" from biographical CEO mentions), cliché-blocklist enforcement (verbatim word list pulled from STATIC_PAGES + a few extras), case-study-pages-describe-clients-not-agency rule, sentence-grade minimum, null > inferred-without-evidence, mandatory source_quotes with verbatim excerpts, mandatory 2-5 specific missing_context prompts per question.
- **No remote tool calls** (`web_fetch`/`web_search`): empirically `web_fetch` is blocked on LinkedIn (`url_not_allowed`) and `web_search` cost ~$0.20/call with poor disambiguation (returned wrong companies for nineyards.pt slug). Conservative null-fallback handles all cases at flat $0.034 per extraction.
- **Extractable questions tagged**: Phase 1 only — Q1.1 (brand name + locale), Q1.3 (entity), Q1.7 (category), Q1.10 (outcomes). Mechanism / pillar / voice / register / lexicon questions remain cold-asked.

### v1 beta — costs and timing observed

Against nineyards.pt:
- Crawl: 6 pages, 13,671 total chars
- Extraction: 6,452 input + 1,274 output tokens
- **Cost: $0.039 per extraction**
- Time: ~30s extraction + ~5s crawl = ~35s end-to-end

---

## DN-002 — Paid scrapers for LinkedIn / Instagram / TikTok signal

**Date:** 2026-05-26 (queued)
**Status:** Designed, not built. Pickup after beta dogfooding.

### Why not v1

Hugo proposed using LinkedIn / IG / TikTok content as signal for voice
and structural drafts. Empirical findings during the v1 build:

- Anthropic's `web_fetch` policy-blocks linkedin.com (`url_not_allowed`).
  Likely same for IG / TikTok.
- Anthropic's `web_search` works but returned poorly-disambiguated
  results for the test brand (returned `nineyards-ltd` UK and
  `nine-yards-nottingham` instead of `nineyards-pt`). Even when it
  returned the right slug, LinkedIn often doesn't publicly show the
  employee-count range.
- Cost spike with `web_search` enabled: $0.034 → ~$0.24 per extraction
  (7×). Each search snippet runs 3-8K chars of encrypted content the
  model still has to read. The cap of `max_uses: 1` held, but cost
  didn't drop meaningfully.
- For nineyards.pt specifically, web_search produced zero useful
  structural inference — paid $0.20 for $0.

### When this lands

Beta cohort dogfooded. We have enough real interview data to know
whether website-only drafts are good enough or whether voice/lexicon
questions specifically need richer signal.

### Architecture sketch

- **LinkedIn**: Proxycurl (`https://nubela.co/proxycurl`) Person + Company Endpoints. ~$0.01-0.10 per lookup. Returns structured JSON: headcount range, recent post text, employment history, growth metrics. Use the LinkedIn URL the v1 crawler already collects in `materials_context.linkedin_urls`. No data migration needed.
- **Instagram + TikTok**: Apify (`https://apify.com`) actors. ~$0.05 per lookup. Returns bio + recent post feed with timestamps + captions.
- **Cadence-as-structure signal** (Hugo's idea): with post-feed timestamps from Apify, compute posting rhythm. Daily across 3 platforms → team or agency. Sporadic / irregular → founder-driven. Consistent schedule → systemized comms. Feeds into Q1.3 structure inference.
- **Consent UX**: explicit Phase 0 checkbox — "Also check social profiles linked from my site (LinkedIn, Instagram, TikTok)." Default off. Reading social feels different from reading a website even though both are public.
- **Question tagging expansion**: Phase 4 (Voice — Q4.1, Q4.2) + Phase 5 (Lexicon — Q5.1) become `extractable` when social content is in scope. Phase 1 extractables stay the same.

### Cost picture

Per extraction with all paid scrapers enabled:
- Base Sonnet 4.6 call: $0.034
- Proxycurl LinkedIn: +$0.02
- Apify Instagram: +$0.05
- Apify TikTok: +$0.05
- **Total: ~$0.15-0.20 per extraction**

For 100 real-brand interviews in beta: $15-20 added cost. Fine.
For 1,000 in scale: $150-200. Worth pricing in.

### Open questions for DN-002

- ToS / scraping legality: Proxycurl and Apify both operate in the gray. For paid clients we may want a Privacy / Terms update making it clear we use third-party data sources.
- API key management: Proxycurl and Apify each need keys in `.env.local`. Add a feature flag (env var `MATERIALS_SCRAPERS_ENABLED=true`) so beta-without-scrapers and post-beta-with-scrapers run from the same codebase.
- Voice signal calibration: how do we keep "they post a lot of inspirational quotes" from leaking into Q4.1 as `"inspirational, motivational"`? Apply the same anti-cliché + anti-extrapolation rules we built for v1 to the social signal too — same prompt scaffolding, new inputs.
