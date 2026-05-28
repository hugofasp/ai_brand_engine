import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
};

// Copy verbatim from NINEYARDS_STATIC_PAGES.md — "Page: FAQ".
const faqs: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "What does brand.soul OS actually deliver?",
    a: "A zipped pack of 12 to 20 text files (depending on locale support) that you upload to Claude Projects or a ChatGPT Custom GPT. Plus two PDF guides for setup and daily use, and a block of paste-in text for the platform's custom instructions field. Together, they make your LLM produce content, reason, and evaluate in your brand's voice.",
  },
  {
    q: "Who is this for?",
    a: "Founders, brand owners, marketing leaders, and operators whose teams use LLMs daily and want consistency. If your team is producing brand-facing content with ChatGPT or Claude and getting inconsistent voice across outputs, this solves that.",
  },
  {
    q: "How long does the interview take?",
    a: "20-40 minutes for mono-lingual brands. 45-90 minutes for multi-locale. The interview is paced, so you can save and return. Most brands finish in two or three sessions.",
  },
  {
    q: "What's the difference between the two products?",
    a: (
      <>
        <p>
          <strong>Brand Identity for LLMs</strong> (currently available, BETA):
          a brand reasoning file pack for textual outputs: content, analysis,
          proposal evaluation. This is what most brands need first.
        </p>
        <p className="mt-3">
          <strong>Design Brand Book for LLMs</strong> (coming soon): extends
          the system to visual identity: design tokens, asset rules, layout
          patterns. For AI design tools.
        </p>
      </>
    ),
  },
  {
    q: "Why are some of the files universal and not customized?",
    a: "Four files (00_SYSTEM_PROTOCOL, 01_CONTEXT_INFERENCE, 90_INDEX, 92_TEST_PROMPTS) are framework infrastructure. They define how the system operates and are identical for every brand. Eight files contain your brand's specific content, and these are customized from your interview.",
  },
  {
    q: "Why does multi-locale double or triple the file count?",
    a: "Voice, lexicon, channel specs, and examples can't be translated. They must be natively written in each language. So we ship four locale-specific files per language, while sharing the framework across them.",
  },
  {
    q: "Do I need a paid Claude or ChatGPT account?",
    a: "Yes. Claude Projects requires Claude Pro or Team. ChatGPT Custom GPTs require Plus or Team. We don't sell access to the LLMs, only the file pack that customizes them.",
  },
  {
    q: "Can I use the file pack with other AI tools?",
    a: "The files are plain text. They're optimized for Claude Projects (best) and ChatGPT Custom GPTs (works with caveats). Other tools may work (the file pack itself doesn't depend on any specific provider) but we test against Claude and ChatGPT only.",
  },
  {
    q: "What if my brand changes? Do I need to redo everything?",
    a: "No. The files are editable: your team can update them directly when something changes. For larger updates (new pillar, new locale), we can regenerate the affected files via the platform.",
  },
  {
    q: "Is my interview data private?",
    a: "Yes. Your interview answers are stored in our database, accessible only to admins (Hugo). We don't share, sell, or repurpose your data. Files generated for you are accessible only to your account and the admin team.",
  },
  {
    q: "How much does it cost?",
    a: "During beta, it's free. We're using this period to refine the platform and the file pack with friendly testers. Pricing will be set after beta. We'll let beta users know before any paid model launches.",
  },
  {
    q: "What happens if I get my files and they're wrong?",
    a: "Reply to the delivery email. Hugo reviews and either revises the files or schedules a brief call to understand what's off. The first cohort of clients is hand-touched: quality matters more than volume right now.",
  },
  {
    q: "Can my whole team use the file pack?",
    a: "Yes. The file pack lives in a Claude Project or Custom GPT, which can be shared with team members. Each team member's conversations are independent but draw from the same source of truth.",
  },
  {
    q: "Why isn't this a SaaS subscription with a dashboard?",
    a: "The file pack is the product. Once you have it, you own it and use it inside Claude or ChatGPT. We're not in the loop after delivery. If you'd like ongoing updates, support, or evolution of the file pack, that's a future service offering.",
  },
  {
    q: "What if Claude or ChatGPT changes how they handle knowledge files?",
    a: "If a provider changes behavior that affects the file pack, we'll update the framework and notify beta users. For paid clients (post-beta), updates will be part of the offering.",
  },
];

export default function FaqPage() {
  return (
    <article className="mx-auto max-w-[720px] px-6 py-20">
      <h1
        className="font-serif lowercase text-[48px] leading-[1.15]"
        style={{ letterSpacing: "-0.015em" }}
      >
        Frequently asked questions
      </h1>

      <dl className="mt-12 space-y-10">
        {faqs.map(({ q, a }) => (
          <div
            key={q}
            className="border-b pb-8"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <dt
              className="font-serif lowercase text-[24px] leading-[1.3]"
              style={{ letterSpacing: "-0.005em" }}
            >
              {q}
            </dt>
            <dd className="mt-4 text-[16px] text-text-secondary [&_strong]:text-text-primary [&_strong]:font-medium">
              {a}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
